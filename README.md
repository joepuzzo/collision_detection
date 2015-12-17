# Final AI Collision Detection

# Getting Started
1. Make sure you have node and npm installed on your machine, they are required.
2. Clone the repository with `git clone https://github.com/joepuzzo/collision_detection.git`
3. cd into the `collision_detection` direcotry and run `npm install`. This will install all the dependencies.
4. Now we just need to install the testing framework `mocha`. Do this by running `npm install mocha`. 
5. Finally make sure everything works by running `npm test`

# Directory Structure
* You will find four main directories in the project.
    - `intro`, some introductory material for those unfamiliar with the language 
    - `lib`, all src files will go into the lib directory. 
        * There are sub directories within lib for organization. 
            - `message`, all src files that deal with messages and the core message protocol are here.
    - `node_modules, all the dependencies are here.
    - `test, any unit tests that are written will go here. typically named after the file they test in the format filename-spec.js. 

# Running the resolver
* The resover is a command line tool that will accept a BonnMotion file and run through a simulation
* In order to run the reslover type the following in the main directory of this project

    `node resolver.js [path2file] [--speed|-s] speed [--verbose|-v]`
* The speed and verbose flags are optional. Default speed is 1 ( I would suggest running it with 3 ) this just makes the simulation go quicker.
* Verbose will log out the distances between nodes as the simulation runs
* The final output of this resolver will be a new bon motion file. > this to a file without the verbose flag or copy the results to a file.

# Running the validator
* The validator is a command line tool that is used to evaluate a BonnMotion file. 
* In order to run the validator type the following in the main directory of this project

    `node lib/algorithms/collision/collision-validator.js [path2file] [--verbose|-v]`
* The verbose flag will give you more output. 

# BonnMotion Files
* Cool! You now know how to run the tools but you don't have any files :(. Don't fret! There are a bunch of example files located here:

    `test/sample_input/`
* Run the resolver with `sample_6n.movements` it has a few collisions and 6 nodes. Then go ahead and validate the results with the validator!
