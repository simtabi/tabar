# ProBar

ProBar is a progress bar with multiple options.

# Features !

  - config a ProBar color.
  - config a ProBar background.
  - config a Speed of ProBar.
  - config a "Goto" option with timing.
  - config a Finish animation.
  - cutomize with your own CSS.
  - config a Height of Probar.
  - config a Rounded Corners of Probar. 
  - config a Rounded Corners of Probar in Internal. 

### Requirement

ProBar require [JQuery](https://code.jquery.com/).

# How to Use :

#### FIRST require CDN JQuery:

```html
<script
  src="https://code.jquery.com/jquery-3.4.1.min.js"
  integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo="
  crossorigin="anonymous"></script>
```

#### Link `ProBar.js` from your html file
```html
<script src="/your/path/to/ProBar.js"></script>
```

#### Secondly instantiate ProBar:

```js
var probar = new ProBar(options);
```

#### The options :

```js
{
    color : "#2a2a2a", // color of the Progress bar. 
    bgColor : "#efefef", // color background of the Progress bar
    speed : 0.3, // speed of animation. ( unit in secondes )
    wrapper : "body", // the wrapper who append ProBar. if class ".class" ,if id "#id" 
    finishAnimation : true || false,  // config a finish animation. 
    classNameBar : "setBar", // change a class to a custom class ( for Css ).
    wrapperId : "wrapperSetBar", // change a wrapper id for a custom Css.
    height:10, // give a height to Probar.
    rounded : { // use it to round Corners of Probar.
      topLeft : 25,
      topRight : 25,
      bottomLeft : 25,
      bottomRight : 25 
    },
    roundedInternal : { // use it to round Corners of Probar (internal).
      topLeft : 25,
      topRight : 25,
      bottomLeft : 25,
      bottomRight : 25 
    }
}
```

#### Functions :

```js
probar.setColor("#2980b9"); // change color of ProBar.
probar.setWrapperColor("#ecf0f1"); // change background color of ProBar.
probar.setSpeed(3000); // change Speed to 3 secondes.
probar.setFinishAnimation(false); // set animation to false.
probar.goto(100); // reach 100%.
probar.goto(100,2000); // reach 100% in 2 secondes.
probar.setHeight(15); // set Height to 15px.
probar.setRounded(15,15,15,15); // change Border radius of Probar. (topLeft, topRight, bottomLeft, bottomRight);
probar.setRoundedInternal(15,15,15,15); // change Border radius of Probar (Internal). (topLeft, topRight, bottomLeft, bottomRight);
```

#### Upcoming features 

 - Remove JQuery requirement.

License
----

MIT

# ** Made with love ❤ **

[jQuery]: <https://jquery.com>
