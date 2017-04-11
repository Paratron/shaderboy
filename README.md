Shaderboy
=========

This library makes it easy to use GLSL shaders on your websites to create really fast, pixel-based animations for images.

Simply place an `<img>` tag somewhere, write a GLSL shader for it and connect them with shaderboy.

Here`s a demo: https://wearekiss.com/preview/shaderboy/test.html

## Basic usage

First, download `shaderboy.js` or `shaderboy.min.js` and load it in your html document.
 
````javascript
 <script src="shaderboy.min.js"></script>
````

You need to write a GLSL shader to manipulate the pixeldata of your images. You can either store your shader(s) in 
separate files on your server, or embed them in script tags into your document - its totally up to you.

To advise shaderboy which images it should manipulate and how to do that, you need to apply some `data-*` attributes
to your `<img>` elements.

The easiest way to attach a GLSL shader to an `<img>` element is this:

````html
	<img src="myimage.jpg" alt="My cool animation" data-shader="myshader.glsl" />
````

Shaderboy will try to load the file `./myshader.glsl` via AJAX and will start to animate the image as soon as it has been loaded.

If you have embedded your shader directly into the HTML document, you need to apply an id to the script tag and tell
shaderboy to use the shader with the given id:

````html
	<script type="text/glsl" id="myshader">
		// SHADER DATA
	</script>
	<img src="myimage.jpg" alt="My cool animation" data-shader="#myshader" />
````

The `#` symbol tells shaderboy that `data-shader` should be treated as an id reference rather than a url.

## Whats happening next

Shaderboy will replace the `<img>` element with a `<canvas>` element. If you have placed
any css classnames on the image, they will be copied over to the canvas element.

After the image has been replaced, the WebGL context will be created by shaderboy, any additional
textures are being loaded and the animation is started.

## Using multiple textures

A modern shader can utilize multiple textures to be used as masks or data sources to compose
complicated effects. Shaderboy allows you as well to load multiple textures to be used to 
animate _one_ image tag. Define them like so:

````html
	<img
		src="myimage.jpg"
		alt="My cool animation"
		data-shader="myshader.glsl"
		data-texture0="a-texture.jpg"
		data-texture1="mymask.png"
	 />
````

Currently, shaderboy allows you to load up to 6 additional texures (together with your original images data)
into your shaders. Simply place the attributes `data-texture0` to `data-texture5`.

All loaded image data - the information of your original `<img>` tag, as well as any
additionally loaded textures are made available inside your GLSL shaders.

Read more about how to access them, below.

## GLSL variables

Shaderboy provides a couple of variables you may access inside your GLSL shaders:

````glsl
uniform sampler2D image;
uniform sampler2D texture0;
uniform sampler2D texture1;
# ... up to texture5
uniform float time;
varying vec2 pixelCoords;
````

The original images data is provided as a texture named `image`, all additionally loaded texures
can be accessed through `texture0` to `texture5`.

Together with the image data, shaderboy will pass a `time` variable to enable you to change your shaders appearance
over time, as well as a vector named `pixelCoords` that contains the coordinates of the currently rendered pixel.




