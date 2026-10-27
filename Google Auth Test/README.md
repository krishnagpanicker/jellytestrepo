# Jelly auth practice starter

Install Node.js LTS on your Mac first. This starter contains our App.js and backend code; Expo generates the rest of the mobile project and installs its dependencies on your Mac.

From this folder, run:

```sh
npx create-expo-app@latest mobile --template blank
cp frontend/App.js mobile/App.js
cd backend
npm install
npm start
```

Visit http://localhost:3000 on your Mac to test the backend. Keep it running and open a second terminal in this folder:

```sh
cd mobile
npx expo start
```

Open the project with Expo Go on your phone. Your Mac and phone should be on the same Wi-Fi network. Expo Go on iOS may require a free Expo account. Stop either server with Ctrl+C.

The two components currently run independently. The screen does not send anything, and there is no login, database connection, or Google sign-in yet. Do not enter real passwords into practice code. Add node_modules and .env to your repo's .gitignore, and never commit secrets.
