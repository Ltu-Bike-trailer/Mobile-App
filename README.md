# Mobile-App
The gitignore have excluded some modules etc that we will need. Follow the guide below to get it working.
And remember to use the "Development build" once the emulator opens the app because the use of BLE is an extended feature outside Expo Go App

# Installation and running the app
How to use this app is as such, we start by installing the modules our project need:

nodejs and npm
```
sudo pacman -S nodejs npm
```
Then run,
```
npm install
```

Now we continue with installing the Expo CLI:
```
npm install -g expo-cli
```

Now you should have the files needed, but make sure you have the eas.json and the app.json file.
To run the program, open a new terminal and go to the project folder, then run the program with this:
```
npx expo start
```

From here you can follow the cli on the screen, in android studio you need to create the emulator for our app (you can only use the emulator for the interface creation, BLE will have to be physically tested)

# Android studio
Download android studio and make sure you got the sdk folder, otherwise rename the folder since it is named Sdk. The app otherwise won't find it and can't start.

Create a new device emulator which is compatible with our code: 
- Select the Pixel 7 phone because it has google play on it
- Use/install the "S" version on it since it's the API31 for androids

After installation, start the emulator then connect the app to the emulator by pressing "a" in the expo CLI window in your terminal.
