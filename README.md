# MCH-DC

r/MinecraftHelp Submission Deletion Check Script

## Installation

Make sure that you have [node.js v16](https://nodejs.org/download/release/v16.13.2/) or later installed

run `npm -v` and `node -v` to check if NPM (Node Package Manager) and node itself are installed

## Filling in the configs

Create a new app at https://old.reddit.com/prefs/apps

select `script` (Script for personal use. Will only have access to the developers accounts)

set the `redirect uri` to `https://not-an-aardvark.github.io/reddit-oauth-helper/`

Copy `Client ID` and `Client Secret` and go to https://not-an-aardvark.github.io/reddit-oauth-helper/ to authorize the app

rename the `.env.example` file to `.env`

fill in `.env` with the bot account credentials

## Edit the Modmail Content

## Running the Script

Install the needed packages with `npm install`

Start the script with `npm start` (Note: this may take a while or error)

If you want to keep the script running, first run it once with `npm start` and then start them with `npm run pm2start`

## Still have questions?

Feel free to open a [issue](https://github.com/Marcel26990/MCH-DC/issues) on this repository
