import { doc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { chooseCondition } from "./choose-condition.mjs";

export const EXPERIMENT_ID = "01-balanced-conditions-demo";

export function participantRef(db, uid) {
  return doc(db, "experiments", EXPERIMENT_ID, "participants", uid);
}

export async function getOrAssignCondition(db, uid) {
  const stateRef = doc(db, "experiments", EXPERIMENT_ID);
  const assignmentRef = participantRef(db, uid);

  return runTransaction(db, async (transaction) => {
    const assignment = await transaction.get(assignmentRef);
    if (assignment.exists()) return assignment.data().condition;

    const state = await transaction.get(stateRef);
    if (!state.exists()) {
      throw new Error(`Missing experiments/${EXPERIMENT_ID}. Create it with a: 0 and b: 0.`);
    }

    const counts = state.data();
    const condition = chooseCondition(counts);
    const key = condition.toLowerCase();
    transaction.update(stateRef, { [key]: counts[key] + 1 });
    transaction.set(assignmentRef, { condition, assignedAt: serverTimestamp() });
    return condition;
  });
}
