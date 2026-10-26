import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { doc, getDocFromServer, getFirestore, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { EXPERIMENT_ID, getOrAssignCondition } from "./assignment.js";

const { initJsPsych, jsPsychHtmlButtonResponse } = window;
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

async function saveResult(resultRef, condition, ratingData) {
  showStatus("Saving your response…");
  try {
    await setDoc(resultRef, {
      condition,
      rating: ratingData.rating,
      rtMs: ratingData.rtMs,
      completedAt: serverTimestamp()
    });
    showStatus("Done. Your response was saved.");
  } catch (error) {
    console.error("Could not save response:", error);
    // A write can commit even if the browser misses its acknowledgement.
    try {
      if ((await getDocFromServer(resultRef)).exists()) {
        showStatus("Done. Your response was saved.");
        return;
      }
    } catch (readError) {
      console.error("Could not check saved response:", readError);
    }
    showStatus("Your response was not confirmed. Check your connection and try again.", () => {
      void saveResult(resultRef, condition, ratingData);
    });
  }
}

function runExperiment(condition, resultRef) {
  let ratingData;
  const descriptions = {
    A: "This reusable bottle is lightweight and easy to carry.",
    B: "This reusable bottle is sturdy and built to last."
  };
  const jsPsych = initJsPsych({
    display_element: "experiment",
    on_finish: () => {
      void saveResult(resultRef, condition, ratingData);
    }
  });

  const timeline = [
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: "<h1>Welcome</h1><p>You will read a short product description and rate its appeal.</p>",
      choices: ["Begin"]
    },
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: `<p>${descriptions[condition]}</p>`,
      prompt: "<p>How appealing is this product? 1 = not at all, 5 = very appealing.</p>",
      choices: ["1", "2", "3", "4", "5"],
      data: { task: "rating", condition },
      on_finish: (data) => {
        ratingData = { rating: data.response + 1, rtMs: Math.round(data.rt) };
      }
    }
  ];

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
      showStatus("You already completed this example in this browser. Your response is saved.");
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
