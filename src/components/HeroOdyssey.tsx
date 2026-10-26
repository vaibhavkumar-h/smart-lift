import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
}

interface FeatureItemProps {
  name: string;
  value: string;
  position: string;
}

interface HeroOdysseyProps {
  onStart: () => void;
}

const Lightning: React.FC<LightningProps> = ({
  hue = 220,
  xOffset = 0,
  speed = 1.6,
  intensity = 0.6,
  size = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext("webgl");

    if (!gl) {
      console.error("WebGL is not supported in this browser.");
      return;
    }

    const resizeCanvas = () => {
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = canvas.clientWidth * pixelRatio;
      canvas.height = canvas.clientHeight * pixelRatio;

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const vertexShaderSource = `
      attribute vec2 aPosition;

      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;

      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;

      vec3 hsv2rgb(vec3 c) {
        vec3 rgb = clamp(
          abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
          0.0,
          1.0
        );

        return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = hash12(i);
        float b = hash12(i + vec2(1.0, 0.0));
        float c = hash12(i + vec2(0.0, 1.0));
        float d = hash12(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x)
          + (c - a) * u.y * (1.0 - u.x)
          + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;

        for (int i = 0; i < 6; i++) {
          value += amplitude * noise(p);
          p = p * 2.0 + 0.7;
          amplitude *= 0.5;
        }

        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        uv = uv * 2.0 - 1.0;
        uv.x *= iResolution.x / iResolution.y;
        uv.x += uXOffset;

        float time = iTime * uSpeed;

        vec2 distortedUv = uv;
        distortedUv += fbm(uv * uSize + time * 0.25) - 0.5;

        float distanceFromCenter = abs(distortedUv.x);

        vec3 baseColor = hsv2rgb(
          vec3(uHue / 360.0, 0.65, 0.9)
        );

        float lightning = 0.025 / max(distanceFromCenter, 0.01);
        lightning *= 0.65 + 0.35 * sin(time * 3.0);

        vec3 color = baseColor * lightning * uIntensity;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (
      source: string,
      type: number
    ): WebGLShader | null => {
      const shader = gl.createShader(type);

      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertexShader = compileShader(
      vertexShaderSource,
      gl.VERTEX_SHADER
    );

    const fragmentShader = compileShader(
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();

    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,

      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(
      program,
      "aPosition"
    );

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    const resolutionLocation = gl.getUniformLocation(
      program,
      "iResolution"
    );

    const timeLocation = gl.getUniformLocation(
      program,
      "iTime"
    );

    const hueLocation = gl.getUniformLocation(
      program,
      "uHue"
    );

    const offsetLocation = gl.getUniformLocation(
      program,
      "uXOffset"
    );

    const speedLocation = gl.getUniformLocation(
      program,
      "uSpeed"
    );

    const intensityLocation = gl.getUniformLocation(
      program,
      "uIntensity"
    );

    const sizeLocation = gl.getUniformLocation(
      program,
      "uSize"
    );

    const startTime = performance.now();

    let animationFrame = 0;

    const render = (currentTime: number) => {
      resizeCanvas();

      gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
      );

      gl.uniform1f(
        timeLocation,
        (currentTime - startTime) / 1000
      );

      gl.uniform1f(hueLocation, hue);
      gl.uniform1f(offsetLocation, xOffset);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(sizeLocation, size);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);

      gl.deleteBuffer(buffer);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
    />
  );
};

const FeatureItem: React.FC<FeatureItemProps> = ({
  name,
  value,
  position,
}) => {
  return (
    <div
      className={`absolute ${position} z-10 transition-transform duration-300 hover:scale-110`}
    >
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_15px_white]" />

        <div>
          <div className="font-medium text-white">
            {name}
          </div>

          <div className="text-sm text-white/60">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroOdyssey: React.FC<HeroOdysseyProps> = ({ onStart }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lightningHue, setLightningHue] = useState(220);
  const [lightningSpeed, setLightningSpeed] = useState(1.6);
  const [lightningIntensity, setLightningIntensity] = useState(0.6);

  const resetSettings = () => {
    setLightningHue(220);
    setLightningSpeed(1.6);
    setLightningIntensity(0.6);
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="relative z-20 mx-auto h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between rounded-full border border-white/10 bg-black/50 px-5 py-4 backdrop-blur-3xl"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
              >
                <path
                  d="M20 5L5 20L20 35L35 20L20 5Z"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="hidden items-center gap-5 md:flex">
              <button
                onClick={onStart}
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
              >
                Start
              </button>

              <button className="text-sm text-white/70 transition hover:text-white">
                Home
              </button>

              <button className="text-sm text-white/70 transition hover:text-white">
                Contacts
              </button>

              <button className="text-sm text-white/70 transition hover:text-white">
                Help
              </button>

              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="text-sm text-white/70 transition hover:text-white"
              >
                Settings
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden text-sm text-white/70 hover:text-white md:block">
              Register
            </button>

            <button className="rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20">
              Application
            </button>

            <button
              className="rounded-md p-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </motion.nav>

        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-4 top-24 z-50 w-80 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-medium">Lightning Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-full px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <label className="mb-2 block text-sm text-white/70">
              Lightning Color
            </label>
            <select
              value={lightningHue}
              onChange={(event) => setLightningHue(Number(event.target.value))}
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              <option value={220} className="bg-black">Blue</option>
              <option value={185} className="bg-black">Cyan</option>
              <option value={270} className="bg-black">Purple</option>
              <option value={330} className="bg-black">Pink</option>
              <option value={0} className="bg-black">Red</option>
              <option value={45} className="bg-black">Yellow</option>
            </select>

            <label className="mb-2 block text-sm text-white/70">
              Speed: {lightningSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={lightningSpeed}
              onChange={(event) => setLightningSpeed(Number(event.target.value))}
              className="mb-4 w-full accent-blue-400"
            />

            <label className="mb-2 block text-sm text-white/70">
              Intensity: {lightningIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              value={lightningIntensity}
              onChange={(event) => setLightningIntensity(Number(event.target.value))}
              className="mb-5 w-full accent-blue-400"
            />

            <button
              onClick={resetSettings}
              className="w-full rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
            >
              Reset Settings
            </button>
          </motion.div>
        )}

        {mobileMenuOpen && (
          <div className="absolute left-4 right-4 top-24 z-50 rounded-2xl border border-white/10 bg-black/95 p-6 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-5 text-center">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStart();
                }}
              >
                Start
              </button>
              <button>Home</button>
              <button>Contacts</button>
              <button>Help</button>
              <button onClick={() => setSettingsOpen(!settingsOpen)}>
                Settings
              </button>
              <button>Register</button>
              <button>Application</button>
            </div>
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative top-[30%] h-40 w-full"
        >
          <motion.div variants={itemVariants}>
            <FeatureItem
              name="Real-Time Monitoring"
              value="for lift status"
              position="left-0 top-20 sm:left-10"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FeatureItem
              name="Smart Lift Control"
              value="for floor operations"
              position="left-1/4 top-0"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FeatureItem
              name="Door Safety"
              value="for secure movement"
              position="right-1/4 top-0"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FeatureItem
              name="System Diagnostics"
              value="for smart alerts"
              position="right-0 top-20 sm:right-10"
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-30 mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-6 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm backdrop-blur-sm transition hover:bg-white/10"
          >
            <span>Smart control for every floor</span>
            <span>→</span>
          </motion.button>

          <motion.h1
            variants={itemVariants}
            className="text-5xl font-light md:text-7xl"
          >
            SMART LIFT
          </motion.h1>

          <motion.h2
            variants={itemVariants}
            className="bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 bg-clip-text pb-3 text-3xl font-light text-transparent md:text-5xl"
          >
            Intelligent Elevator Control
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="mb-9 max-w-2xl text-gray-400"
          >
            Lightning animation is 100% code generated, so feel free
            to customize it to your liking.
          </motion.p>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="rounded-full bg-white/10 px-8 py-3 backdrop-blur-sm transition hover:bg-white/20"
          >
            Enter Smart Lift
          </motion.button>
        </motion.div>
      </div>

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/80" />

        <div className="absolute left-1/2 top-[55%] h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-500/20 to-purple-600/10 blur-3xl" />

        <Lightning
          hue={lightningHue}
          speed={lightningSpeed}
          intensity={lightningIntensity}
        />

        <div className="absolute left-1/2 top-[55%] z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_25%_90%,#1e386b_15%,#000000de_70%,#000000ed_100%)] backdrop-blur-3xl" />
      </div>
    </section>
  );
};

export default HeroOdyssey;