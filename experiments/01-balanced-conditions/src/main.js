import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDocFromServer, getFirestore, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { EXPERIMENT_ID, getOrAssignCondition } from "./assignment.js";
import { PRACTICE_ITEMS, RESPONSE_DEADLINE_MS, TEST_ITEMS, scoreResponse } from "./task.mjs";

const { initJsPsych, jsPsychHtmlButtonResponse, jsPsychHtmlKeyboardResponse } = window;
const status = document.querySelector("#status");
const experiment = document.querySelector("#experiment");

function showStatus(message, retry) {
  experiment.hidden = true;
  status.hidden = false;
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  status.replaceChildren(paragraph);
  if (retry) {
    const button = document.createElement("button");
    button.textContent = "Try saving again";
    button.addEventListener("click", retry, { once: true });
    status.append(button);
  }
}

async function saveResult(resultRef, condition, trials) {
  showStatus("Saving your responses…");
  try {
    await setDoc(resultRef, {
      condition,
      taskVersion: 2,
      trials,
      completedAt: serverTimestamp()
    });
    showStatus("Done. Your responses were saved.");
  } catch (error) {
    console.error("Could not save response:", error);
    // A write can commit even if the browser misses its acknowledgement.
    try {
      if ((await getDocFromServer(resultRef)).exists()) {
        showStatus("Done. Your responses were saved.");
        return;
      }
    } catch (readError) {
      console.error("Could not check saved response:", readError);
    }
    showStatus("Your responses were not confirmed. Check your connection and try again.", () => {
      void saveResult(resultRef, condition, trials);
    });
  }
}

function runExperiment(condition, resultRef) {
  let practiceFeedback = "";
  const instruction = condition === "A"
    ? "Focus on speed: respond as quickly as you can while trying to be correct."
    : "Focus on accuracy: decide carefully, then respond before the 2.5-second deadline.";
  const jsPsych = initJsPsych({
    display_element: "experiment",
    on_finish: () => {
      const trials = jsPsych.data.get().filter({ phase: "test" }).values().map((data, index) => ({
        trialIndex: index + 1,
        ...scoreResponse({ text: data.item, lexicality: data.lexicality }, data.response, data.rt)
      }));
      if (trials.length !== TEST_ITEMS.length) {
        showStatus("The task ended early, so no data was saved. Please reload to try again.");
        return;
      }
      void saveResult(resultRef, condition, trials);
    }
  });

  function fixationTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<p class="word-stimulus">+</p>',
      choices: "NO_KEYS",
      trial_duration: 300
    };
  }

  function wordTrial(item, phase) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<p class="word-stimulus">${item.text}</p>`,
      prompt: '<p class="key-hint"><kbd>F</kbd> = word &nbsp; <kbd>J</kbd> = not a word</p>',
      choices: ["f", "j"],
      trial_duration: RESPONSE_DEADLINE_MS,
      data: { phase, item: item.text, lexicality: item.lexicality },
      on_finish: (data) => {
        const scored = scoreResponse(item, data.response, data.rt);
        data.correct = scored.correct;
        if (phase === "practice") {
          practiceFeedback = scored.response === null ? "Too slow" : scored.correct ? "Correct" : "Incorrect";
        }
      }
    };
  }

  const timeline = [{
    type: jsPsychHtmlButtonResponse,
    stimulus: `<h1>Word or not a word?</h1>
      <p>Press <kbd>F</kbd> for an English word and <kbd>J</kbd> for a made-up word.</p>
      <p>Each item stays on screen for up to 2.5 seconds. You will get four practice trials with feedback, then 12 test trials.</p>
      <p>${instruction}</p>`,
    choices: ["Start practice"]
  }];

  for (const item of jsPsych.randomization.shuffle(PRACTICE_ITEMS)) {
    timeline.push(fixationTrial(), wordTrial(item, "practice"), {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: () => `<p>${practiceFeedback}</p>`,
      choices: "NO_KEYS",
      trial_duration: 600
    });
  }

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<p>Practice is complete. The next 12 trials will have no feedback.</p>",
    choices: ["Start test"]
  });

  for (const item of jsPsych.randomization.shuffle(TEST_ITEMS)) {
    timeline.push(fixationTrial(), wordTrial(item, "test"));
  }

  status.hidden = true;
  experiment.hidden = false;
  jsPsych.run(timeline);
}

async function start() {
  let step = "connecting to Firebase";
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    step = "signing in anonymously";
    const { user } = await signInAnonymously(getAuth(app));
    step = `assigning a condition at experiments/${EXPERIMENT_ID}`;
    const condition = await getOrAssignCondition(db, user.uid);
    const resultRef = doc(db, "experiments", EXPERIMENT_ID, "participants", user.uid, "results", "final");
    step = "checking for an earlier response";
    if ((await getDocFromServer(resultRef)).exists()) {
      showStatus("You already completed this example in this browser. Your responses are saved.");
      return;
    }
    runExperiment(condition, resultRef);
  } catch (error) {
    console.error(`Could not finish ${step}:`, error);
    const hint = error.code === "permission-denied"
      ? ` Check that the Firestore rules for experiments/${EXPERIMENT_ID} are published in project ${firebaseConfig.projectId}.`
      : "";
    showStatus(`Could not finish ${step}: ${error.message}${hint}`);
  }
}

void start();
