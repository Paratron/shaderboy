/**
 * Shaderboy
 * =========
 *
 * @author Christian Engel <hello@wearekiss.com>
 * @license MIT
 * @version 1
 */
(function () {
    'use strict';

    var shaderboy = window.shaderboy = {
        canvases: [],
        fragmentShaders: {},
        defaultVertexShader: 'attribute vec2 position;varying vec2 pixelCoords;\nvoid main() {\ngl_Position = vec4(vec2(position * vec2(2,2)) - vec2(1,1), 0., 1.);\npixelCoords=position;}',
        defaultVertex: [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0],
        onerror: function () {
        }
    };

    var gl,
        loaders = {},
        store = {},
        resizeTimeout = null;

    /**
     * Will attempt to load all required shaders and/or textures for the given domElement.
     * @param domElement
     */
    function collectAssets(domElement, callback) {
        var shaderIdentifier = domElement.getAttribute('data-shader'),
            scriptElement,
            waitingFor = 0,
            outShaders = {fragment: shaderIdentifier, vertex: null},
            outTextures = [];

        function startedLoading() {
            waitingFor++;
        }

        function finishedLoading() {
            waitingFor--;

            if (waitingFor <= 0) {
                callback(outShaders, outTextures);
            }
        }

        startedLoading();

        //Shader loader has not been cached?
        if (!loaders[shaderIdentifier]) {
            if (shaderIdentifier.substr(0, 1) === '#') {
                scriptElement = document.getElementById(shaderIdentifier.substr(1));
                if (scriptElement === null) {
                    console.error('Unable to locate the script tag with id ' + shaderIdentifier);
                    shaderboy.onerror();
                    return;
                }
                loaders[shaderIdentifier] = scriptElement;
                storeFragmentShader(shaderIdentifier, scriptElement.innerHTML);
            } else {
                scriptElement = new XMLHttpRequest();

                scriptElement.onload = function (e) {
                    loaders[shaderIdentifier].innerHTML = e.target.responseText;
                    storeFragmentShader(shaderIdentifier, e.target.responseText);
                    finishedLoading();
                };
                startedLoading();

                scriptElement.open('GET', shaderIdentifier);
                scriptElement.send();
                loaders[shaderIdentifier] = document.createElement('script');
            }

        } else {
            //Shader loader (script tag) has been created before. Use that.
            storeFragmentShader(shaderIdentifier, loaders[scriptIdentifier].innerHTML);
        }

        var textures = [],
            i, t;

        textures.push(domElement.getAttribute('src'));
        outTextures.push(null);

        for (i = 0; i <= 5; i++) {
            if (!domElement.hasAttribute('data-texture' + i)) {
                break;
            }

            textures.push(domElement.getAttribute('data-texture' + i));
            outTextures.push(null);
        }

        for (i = 0; i < textures.length; i++) {
            t = textures[i];

            if (!loaders[t]) {
                if (t.substr(0, 1) === '#') {
                    outTextures[i] = document.getElementById(t.substr(1));
                    if (outTextures[i] === null) {
                        console.error('Unable to locate image tag with id ' + t);
                        shaderboy.onerror();
                        return;
                    }
                    loaders[t] = outTextures[i];
                } else {
                    outTextures[i] = loaders[t] = new Image();
                    outTextures[i].onload = function () {
                        finishedLoading();
                    };
                    startedLoading();
                    outTextures[i].src = t;
                }
            } else {
                outTextures[i] = loaders[t];
            }
        }

        finishedLoading();
    }

    /**
     * Stores the source of a fragment shader.
     * @param key
     * @param source
     */
    function storeFragmentShader(key, source) {
        if (shaderboy.fragmentShaders[key]) {
            console.log('Shader source with the id "' + key + '" already exists and has been replaced.');
        }
        shaderboy.fragmentShaders[key] = source;
    }

    /**
     * Returns the default vertex shader thats used for 99% of all images.
     * @param gl
     * @returns {*}
     */
    function getDefaultVertexShader(gl) {
        return createShader(gl, shaderboy.defaultVertexShader, gl.VERTEX_SHADER);
    }

    function createShader(gl, source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log('Shader compilation failed');
            var error = gl.getShaderInfoLog(shader);
            console.error(error);
            shaderboy.onerror();
            return null;
        }

        return shader;
    }

    /**
     * This creates a webgl program and compiles and links all the needed shaders.
     * @param gl
     * @param vertexShader
     * @param fragmentShader
     */
    function compileShaders(gl, vertexShaderName, fragmentShaderName) {
        var program = gl.createProgram(),
            vertexShader,
            fragmentShader;

        if (!vertexShaderName) {
            vertexShader = getDefaultVertexShader(gl);
        }

        fragmentShader = createShader(gl, shaderboy.fragmentShaders[fragmentShaderName], gl.FRAGMENT_SHADER);

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        return program;
    }

    function webGLStart(inCanvasElement, domElement, fragmentShaderId, textures) {
        var gl,
            sbId = Math.random().toString().split('.')[1];

        inCanvasElement.sbId = sbId;

        gl = inCanvasElement.getContext('experimental-webgl', {antialias: true});

        if (!gl) {
            gl = inCanvasElement.getContext('webgl');
        }

        gl.viewportWidth = inCanvasElement.width;
        gl.viewportHeight = inCanvasElement.height;

        var program = compileShaders(gl, null, fragmentShaderId);

        if (!program) {
            return;
        }

        var vertexPosition = gl.getAttribLocation(program, 'position');

        store[sbId] = {
            canvas: inCanvasElement,
            gl: gl,
            program: program,
            renderStart: Date.now(),
            textures: [],
            uniforms: {
                time: gl.getUniformLocation(program, 'time'),
                image: gl.getUniformLocation(program, 'image'),
                texture0: gl.getUniformLocation(program, 'texture0'),
                texture1: gl.getUniformLocation(program, 'texture1'),
                texture2: gl.getUniformLocation(program, 'texture2'),
                texture3: gl.getUniformLocation(program, 'texture3'),
                texture4: gl.getUniformLocation(program, 'texture4'),
                texture5: gl.getUniformLocation(program, 'texture5')
            },
            attributes: {
                position: vertexPosition,
                vertexes: initBuffers(gl)
            }
        };

        gl.enableVertexAttribArray(vertexPosition);

        //Add all previously collected textures.
        for (var i = 0; i < textures.length; i++) {
            store[sbId].textures.push(true);
            linkTexture(gl, textures[i], i);
        }

        gl.clearColor(0, 0, 0, 0);
        gl.disable(gl.DEPTH_TEST);
    }

    function initBuffers(gl) {
        var squareVertexPositionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shaderboy.defaultVertex), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 3;
        squareVertexPositionBuffer.numItems = 4;

        return squareVertexPositionBuffer;
    }

    function linkTexture(gl, img, index) {
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // Prevents s-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }


    function drawScene(inStore) {
        var gl = inStore.gl,
            canvas = inStore.canvas,
            squareVertexPositionBuffer = inStore.attributes.vertexes,
            vertexPosition = inStore.attributes.position;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        //if (!currentProgram)
        //    return;
        gl.uniform1i(inStore.uniforms.image, 0);
        gl.uniform1f(inStore.uniforms.time, (Date.now() - inStore.renderStart) / 1000);

        for (var i = 0; i < inStore.textures.length; i++) {
            if (inStore.textures[i]) {
                gl.uniform1i(inStore.uniforms['texture' + i], i + 1);
            }
        }

        /*gl.uniform1f(currentProgram.uniformsCache['uTime'], time);
         gl.uniform1i(currentProgram.uniformsCache['uSampler0'], 0);
         gl.uniform1i(currentProgram.uniformsCache['uSampler1'], 1);
         gl.uniform1i(currentProgram.uniformsCache['uSampler2'], 2);
         gl.uniform1i(currentProgram.uniformsCache['uSampler3'], 3);
         gl.uniform1i(currentProgram.uniformsCache['uSampler4'], 4);
         gl.uniform1i(currentProgram.uniformsCache['uSampler5'], 5);
         gl.uniform1f(currentProgram.uniformsCache['mousex'], mousex);
         gl.uniform1f(currentProgram.uniformsCache['mousey'], mousey);*/

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        gl.vertexAttribPointer(vertexPosition, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    }

    function tick() {
        window.requestAnimationFrame(tick);

        for (var key in store) {
            drawScene(store[key]);
        }
    }

    /**
     * Replaces a DOM element with a webGL enabled canvas.
     * @param domElement
     */
    function replaceElement(domElement, keepOriginal, callback) {
        var canvas = document.createElement('canvas');

        shaderboy['canvases'].push(canvas);

        canvas.className = domElement.className + ' shaderboy';

        setSize(canvas, domElement);

        collectAssets(domElement, function (shaders, textures) {

            if (keepOriginal) {
                domElement.className += ' shaderboy-replaced';
                domElement.parentNode.insertBefore(canvas, domElement);
            } else {
                domElement.parentNode.replaceChild(canvas, domElement);
            }

            webGLStart(
                canvas,
                domElement,
                shaders.fragment,
                textures
            );

            setTimeout(function () {
                tick(canvas);
            }, 1);

            if (callback) {
                callback(canvas);
            }
        });
    }

    function setSize(toCanvas, fromElement) {
        var w = fromElement.offsetWidth, h = fromElement.offsetHeight;
        toCanvas.width = w;
        toCanvas.height = h;
    }

    // ====================================================================================================

    shaderboy.webglSupported = false;

    (function () {
        var test = document.createElement('canvas'),
            gl;

        try {
            gl = test.getContext('experimental-webgl');

            if (!gl) {
                gl = test.getContext('webgl');
            }

            if (!gl) {
                console.log('Webgl is not supported on this platform.');
                return;
            }
        }
        catch (e) {
            console.log('Webgl is not supported on this platform.');
            return;
        }

        shaderboy.webglSupported = true;
    })();

    /**
     * Initializes the library.
     * This will scan the DOM for elements that have a "data-shader" attribute defined and replaces them
     * with a WebGL enabled canvas element.
     */
    shaderboy['autoReplace'] = function () {
        if (!shaderboy.webglSupported) {
            return;
        }

        var elements = document.querySelectorAll('[data-shader]');

        for (var i = 0; i < elements.length; i++) {
            replaceElement(elements[i]);
        }
    };

    shaderboy['replace'] = function (domElement, keepOriginal, callback) {
        if (!shaderboy.webglSupported) {
            return;
        }

        replaceElement(domElement, keepOriginal, callback);
    };

    window.addEventListener('resize', function(){
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function(){
            var canvases = shaderboy['canvases'];
            for(var i = 0; i < canvases.length; i++){
                setSize(canvases[i], canvases[i]);
            }
        }, 100);
    });
})();