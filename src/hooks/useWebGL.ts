import { useRef, useCallback } from 'react';

export const useWebGL = () => {
  const glRef = useRef<WebGLRenderingContext | null>(null);

  const initWebGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    
    glRef.current = gl as WebGLRenderingContext;
    
    // Vertex shader for points
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      attribute vec3 color;
      uniform vec2 resolution;
      uniform float pointSize;
      varying vec3 vColor;
      
      void main() {
        vec2 zeroToOne = position / resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = pointSize;
        vColor = color;
      }
    `);
    gl.compileShader(vertexShader);
    
    // Fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      varying vec3 vColor;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        if (length(coord) > 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0);
      }
    `);
    gl.compileShader(fragmentShader);
    
    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    
    return { gl, program };
  }, []);

  const drawPlotsWebGL = useCallback((plots: any[], canvas: HTMLCanvasElement) => {
    const result = initWebGL(canvas);
    if (!result) return;
    
    const { gl, program } = result;
    
    // Prepare plot data
    const positions = new Float32Array(plots.length * 2);
    const colors = new Float32Array(plots.length * 3);
    
    plots.forEach((plot, i) => {
      positions[i * 2] = plot.x * canvas.width;
      positions[i * 2 + 1] = plot.y * canvas.height;
      
      // Convert hex color to RGB
      const hex = plot.color.replace('#', '');
      colors[i * 3] = parseInt(hex.substr(0, 2), 16) / 255;
      colors[i * 3 + 1] = parseInt(hex.substr(2, 2), 16) / 255;
      colors[i * 3 + 2] = parseInt(hex.substr(4, 2), 16) / 255;
    });
    
    // Set up buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
    // Draw
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.drawArrays(gl.POINTS, 0, plots.length);
  }, [initWebGL]);

  return { drawPlotsWebGL };
};