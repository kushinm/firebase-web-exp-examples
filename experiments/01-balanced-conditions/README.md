# 01 — Balanced between-subjects assignment

This jsPsych example shows one of two descriptions of a reusable bottle, asks for a 1–5 rating, and saves the rating and response time to Firestore. Each new browser identity gets whichever condition has fewer **assignments**. Ties are broken at random.

## Run it with your Firebase project

1. Complete the [Firebase project setup](../../README.md#set-up-firebase).
2. In the Firebase console, open **Authentication → Sign-in method**, select **Anonymous**, and enable it.
3. Open **Firestore → Data**. Create a collection named `experiments` with a document named `01-balanced-conditions-demo`. Add two **number** fields, `a` and `b`, both set to `0`. These are the assignment counts.
4. Open **Firestore → Rules**. Replace the rules with [firestore.rules](firestore.rules) and click **Publish**. Use a separate practice project if you already have rules for another app.
5. From the repo root, copy the config template:

   ```bash
   cd experiments/01-balanced-conditions
   cp src/firebase-config.example.js src/firebase-config.js
   ```

6. Paste your Firebase web app's `firebaseConfig` object into `src/firebase-config.js`. Start a local server from this folder:

   ```bash
   python3 -m http.server 8000
   ```

7. Open [http://localhost:8000](http://localhost:8000) and complete the task. Internet access is needed to load the pinned jsPsych and Firebase browser files.

Check **Firestore → Data**: `experiments/01-balanced-conditions-demo` should now have one count of `1`. Your response is under `experiments/01-balanced-conditions-demo/participants/{uid}/results/final`. Use a second browser profile to try another participant; reloading the first profile keeps its original condition and does not increase the count.

If the page says **Missing or insufficient permissions**, check that the document ID in Firestore Data matches both `src/assignment.js` and the `match` path in `firestore.rules`, and that you published those rules in the project named in `src/firebase-config.js`.

## Publish on every push

For the lab's `jspsych-firebase-demos` project, a GitHub Action deploys this example to [https://jspsych-firebase-demos.web.app/](https://jspsych-firebase-demos.web.app/) whenever `master` is pushed. A maintainer needs to do this once:

1. Sign in with the [Firebase CLI](https://firebase.google.com/docs/cli) using `firebase login`. From the repo root, run `firebase init hosting:github --project jspsych-firebase-demos`. Choose the GitHub repo `kushinm/firebase-web-exp-examples-Private` and `master` for live deploys. The wizard creates a deploy service account and uploads the `FIREBASE_SERVICE_ACCOUNT_JSPSYCH_FIREBASE_DEMOS` secret to GitHub. Keep this repo's `.github/workflows/firebase-hosting-merge.yml` if asked to overwrite it. The wizard also creates a pull request workflow, which this repo ignores. If its merge workflow includes `npm ci`, restore the version in this repo; the experiment has no build step.
2. Commit and push this repo's files to `master`:

   ```bash
   git add .
   git commit -m "Add first experiment and Hosting deploy"
   git push -u origin master
   ```

   Check the **Actions** tab for the deploy result, then open the site URL above. Later pushes to `master` update the site automatically.

The workflow copies the demo's [public Firebase web config](../../hosting/firebase-config.js) into the site before deploying. The **deploy service account** remains a GitHub secret; no second secret is needed for the web config. Firestore Security Rules control data access.

The workflow publishes the static experiment files, not Firestore rules. Publish changes to `firestore.rules` in the Firebase console before pushing code that needs them. To host from your own Firebase project, change the web config, project ID, and service account secret name in [the workflow](../../.github/workflows/firebase-hosting-merge.yml).

The GitHub repository can be private, but the Firebase Hosting URL is public.

## How the pieces fit

| File | Purpose |
| --- | --- |
| `src/main.js` | Signs in anonymously, runs the jsPsych trials, saves the result. |
| `src/assignment.js` | Updates counts and assignment inside a Firestore transaction. |
| `src/choose-condition.mjs` | Chooses the least full condition; uses no external library. |
| `firestore.rules` | Allows only a participant's own assignment and result, and checks that assignment and count change together. |
| `src/firebase-config.js` | Your local Firebase web configuration; ignored by Git. |

The transaction updates the count and creates the participant's assignment together. If two new participants arrive at once, Firestore retries a conflicting transaction against the new counts. The result is saved separately after the participant answers. Participants can read the shared counts and their own documents; they cannot list other participants' responses.

**Scope:** Counts track assignments, so someone who leaves before answering still occupies a slot. Anonymous sign-in identifies a browser installation, not a unique person. This browser-only example is for learning; use a trusted assignment service and a study-specific access plan before recruiting real participants.

This example needs no package installation or build step. If you have Node.js, you can run the small allocation check with `node --test src/assignment.test.mjs`.

See Firebase's guides to [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [anonymous sign-in](https://firebase.google.com/docs/auth/web/anonymous-auth), and [Security Rules](https://firebase.google.com/docs/firestore/security/get-started) for more background.
