Some folks were talking about how minimal they could make a functional coding agent.

I decided to play the game.

A larger first draft was, roughly, what Claude Code could do.

Then I set it upon itself.

Over the course of 20 minutes, it golfed itself down to something pretty darn minimal.

`src/smallest-agent.js` is currently 493 bytes.

`src/smallest-agent.commented.js` is a commented version of the code with easier to read variable names.

`terser -c -m --module src/smallest-agent.commented.js > src/smallest-agent.js` is how we do the last bit of the transform.

`npm test` runs a repeatable smoke test against the live API (`hi`, `uuidgen`, and a failing shell command).

IT HAS UNRESTRICTED BASH ACCESS.
IT CAN DO ANYTHING.
IT MIGHT DECIDE TO ERASE ALL YOUR FILES AND INSTALL LINUX
