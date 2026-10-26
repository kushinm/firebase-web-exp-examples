# Firebase web experiment examples

This repo contains small [jsPsych](https://www.jspsych.org/) experiments that save data to Cloud Firestore. Start by making your own Firebase project, then run the first example below.

Examples use no npm dependencies by default. The first example loads pinned jsPsych and Firebase browser files from their CDNs.

## Examples

- [01 — Balanced between-subjects assignment](experiments/01-balanced-conditions/README.md)

The first example can also [deploy automatically to Firebase Hosting](experiments/01-balanced-conditions/README.md#publish-on-every-push).

## Set up Firebase

1. Sign in to the [Firebase console](https://console.firebase.google.com/) with a Google account and select **Create a project**. Give it a name, such as `web-experiments-demos`. You can skip the optional Google Analytics setup. Finish creating the project.
2. On the project overview page, click the **Web** icon (`</>`) to register a web app. Give it a nickname, such as `jspsych-experiment`, and click **Register app**. You do not need to set up Hosting yet. In some newer views of the Firebase overview page you might need to click **Add app** first, then select the web icon.
3. In the left menu, open **Databases & Storage → Firestore** and click **Create database**. Choose **Standard edition** if asked, then select a location near your participants. Choose **Production mode** for the starting security rules and click **Create**.
4. Open **Project settings → Your apps**, select your web app, and choose **Config** under the Firebase SDK snippet. Keep this `firebaseConfig` object handy; the experiment will use it to connect to your project.
It will look something like this:

```javascript
const firebaseConfig = {
  apiKey: "XXXXX",
  authDomain: "web-experiments-demos.firebaseapp.com",
  projectId: "web-experiments-demos",
  storageBucket: "web-experiments-demos.firebasestorage.app",
  messagingSenderId: "XXXXXXXXX",
  appId: "X:XXXXX",
  measurementId: "X-XXXXXXXXXX"
};
```

Your Firebase project is now ready for the example code. **Production mode blocks browser reads and writes** until you add Firestore Security Rules. The first experiment includes those rules; do not collect participant data before they are in place.

Firebase's [web setup guide](https://firebase.google.com/docs/web/setup) and [Firestore setup guide](https://firebase.google.com/docs/firestore/quickstart) have more detail if the console screens differ.
