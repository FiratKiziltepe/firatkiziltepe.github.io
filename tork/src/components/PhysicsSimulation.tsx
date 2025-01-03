import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, HelpCircle, Save } from 'lucide-react';

interface SimulationState {
  mass: number;
  initialVelocity: number;
  finalVelocity: number;
  collisionTime: number;
  isPlaying: boolean;
  animationSpeed: number;
}

const PhysicsSimulation: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    mass: 1,
    initialVelocity: 0,
    finalVelocity: 10,
    collisionTime: 1,
    isPlaying: false,
    animationSpeed: 1,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const calculateMomentumChange = () => {
    return state.mass * (state.finalVelocity - state.initialVelocity);
  };

  const calculateImpulse = () => {
    return calculateMomentumChange();
  };

  const formatScientific = (num: number): string => {
    return num.toExponential(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const resetSimulation = () => {
    setState({
      mass: 1,
      initialVelocity: 0,
      finalVelocity: 10,
      collisionTime: 1,
      isPlaying: false,
      animationSpeed: 1,
    });
  };

  const toggleAnimation = () => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const saveData = () => {
    const data = {
      ...state,
      momentumChange: calculateMomentumChange(),
      impulse: calculateImpulse(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'physics-simulation-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let position = 0;
    let time = 0;

    const animate = () => {
      if (!state.isPlaying) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background grid
      ctx.strokeStyle = '#e5e7eb';
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Calculate object position
      const progress = time / (state.collisionTime * 1000);
      if (progress <= 1) {
        const currentVelocity = state.initialVelocity + 
          (state.finalVelocity - state.initialVelocity) * progress;
        position += currentVelocity * 0.016; // 16ms frame time
      }

      // Draw object
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2 + position * 10,
        canvas.height / 2,
        10 + state.mass * 5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw velocity vector
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 + position * 10, canvas.height / 2);
      const currentVelocity = state.initialVelocity + 
        (state.finalVelocity - state.initialVelocity) * Math.min(progress, 1);
      ctx.lineTo(
        canvas.width / 2 + position * 10 + currentVelocity * 10,
        canvas.height / 2
      );
      ctx.stroke();

      time += 16 * state.animationSpeed;
      animationRef.current = requestAnimationFrame(animate);
    };

    if (state.isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, state.mass, state.initialVelocity, state.finalVelocity, 
      state.collisionTime, state.animationSpeed]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Physics Simulation: Impulse and Momentum Change
          </h1>

          <div className="mb-8">
            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              className="w-full h-[200px] border border-gray-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mass (kg)
                </label>
                <input
                  type="range"
                  name="mass"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={state.mass}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{state.mass} kg</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Initial Velocity (m/s)
                </label>
                <input
                  type="range"
                  name="initialVelocity"
                  min="-100"
                  max="100"
                  step="0.1"
                  value={state.initialVelocity}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">
                  {state.initialVelocity} m/s
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Final Velocity (m/s)
                </label>
                <input
                  type="range"
                  name="finalVelocity"
                  min="-100"
                  max="100"
                  step="0.1"
                  value={state.finalVelocity}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">
                  {state.finalVelocity} m/s
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Collision Time (s)
                </label>
                <input
                  type="range"
                  name="collisionTime"
                  min="0.01"
                  max="10"
                  step="0.01"
                  value={state.collisionTime}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">
                  {state.collisionTime} s
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Momentum Change (Δp):</span>{' '}
                  {formatScientific(calculateMomentumChange())} kg⋅m/s
                </p>
                <p>
                  <span className="font-medium">Impulse (F⋅Δt):</span>{' '}
                  {formatScientific(calculateImpulse())} N⋅s
                </p>
                <p>
                  <span className="font-medium">Average Force:</span>{' '}
                  {formatScientific(calculateImpulse() / state.collisionTime)} N
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={toggleAnimation}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span className="ml-2">
                {state.isPlaying ? 'Pause' : 'Play'}
              </span>
            </button>

            <button
              onClick={resetSimulation}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RefreshCw size={20} />
              <span className="ml-2">Reset</span>
            </button>

            <button
              onClick={saveData}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save size={20} />
              <span className="ml-2">Save Data</span>
            </button>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Animation Speed:
              </label>
              <input
                type="range"
                name="animationSpeed"
                min="0.1"
                max="5"
                step="0.1"
                value={state.animationSpeed}
                onChange={handleInputChange}
                className="w-32"
              />
              <span className="text-sm text-gray-500">
                {state.animationSpeed}x
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicsSimulation;