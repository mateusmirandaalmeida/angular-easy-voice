# Angular Easy Voice

Is a voice command library.

## Installation
```
bower install angular-easy-voice --save
```

## Add dependencies to the <head> section of your main html:
```
<script src="bower_components/angular-easy-voice/dist/EasyVoice.min.js"></script>
```

## Add module
```
MODULE NAME: 'angular-easy-voice';

angular.module('myApp', ['angular-easy-voice'])
       .controller('myCtrl', function('$scope', EasyVoice){
              console.log(EasyVoice);
         });
```
## Basic usage
```
// The first parameter is the phrase that will turn on the voice command.
EasyVoice.initWatch('Ok Google', {
    lang: 'pt-BR', // language
    debug: false // Shows the user's speech
}, function(resp){
    console.log(resp);
});
```
## Stop
```
EasyVoice.stopWatch();
```
## Example
```
EasyVoice.addCommand('hello', function(){
    console.log('hello my friend!');
});
```
## Installation of dependencies for use or development
```
npm install
```
## Tasks
Run the task 'npm run dev' for the development.
Run the task 'npm run prod' generating the minified file.
