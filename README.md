# hubot-variables

The best project ever.

## Getting Started

1. Install the module: `npm install --save hubot-variables`
2. Add it `hubot-variables` to your external-scripts.json file in your hubot directory

## Configuration:

ALWAYS_VARIABLE - Process all output instead of modules that specificlly handle it (not in unit tests yet)

## Commands:

* hubot create var [varname] - Create new variable
* hubot remove var [varname] - Remove Variable
* hubot remove var [varname]! - Remove variable - confirmed
* hubot add value [varname] [value] - Add value to variable
* hubot remove value [varname] [value] - Remove value from variable
* hubot var [varname] type [var|verb|noun] - Set type of variable
* hubot list var [varname] - List values in variable
* hubot list vars - List all variables

## Release Notes

See [CHANGELOG.md](CHANGELOG.md)

## License
Copyright (c) 2013, 2016 Gavin Mogan  
Licensed under the MIT license.
