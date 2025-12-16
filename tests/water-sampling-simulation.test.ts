/**
 * Tests for Water Sampling Simulation Module
 * 
 * **Feature: water-sampling-simulation**
 * Tests the core state management functionality of the water sampling simulation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import the module (we need to mock localStorage for Node environment)
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Mock localStorage before importing the module
(global as any).localStorage = mockLocalStorage;

// ============ Simulation Types (matching the implementation) ============

const SimulationPhase = {
  POINT_SELECTION: 'point_selection',
  EQUIPMENT_PREP: 'equipment_prep',
  SAMPLING: 'sampling',
  FIELD_TEST: 'field_test',
  PRESERVATION: 'preservation',
  COMPLETE: 'complete'
} as const;

type SimulationPhaseType = typeof SimulationPhase[keyof typeof SimulationPhase];

const SIMULATION_PHASE_ORDER: SimulationPhaseType[] = [
  SimulationPhase.POINT_SELECTION,
  SimulationPhase.EQUIPMENT_PREP,
  SimulationPhase.SAMPLING,
  SimulationPhase.FIELD_TEST,
  SimulationPhase.PRESERVATION,
  SimulationPhase.COMPLETE
];

interface RiverConfig {
  width: number;
  depth: number;
  flowDirection: 'left' | 'right';
  pollutionSource: { x: number; y: number; type: string };
  landmarks: Array<{ x: number; y: number; name: string }>;
}

interface SamplingPoint {
  id: string;
  sectionId: string;
  position: { x: number; y: number; depth: number };
  type: 'surface' | 'middle' | 'bottom';
  isValid: boolean;
  validationMessage?: string;
}

interface Equipment {
  id: string;
  name: string;
  type: 'bottle' | 'sampler' | 'preservative' | 'tool';
  material: string;
  volume?: number;
  suitableFor: string[];
  notes: string;
}

interface SamplingOperation {
  id: string;
  pointId: string;
  step: 'rinse' | 'sample' | 'seal' | 'label';
  timestamp: number;
  duration: number;
  isCorrect: boolean;
  notes?: string;
}

interface FieldMeasurement {
  id: string;
  pointId: string;
  parameter: 'temperature' | 'pH' | 'DO' | 'conductivity' | 'turbidity';
  value: number;
  unit: string;
  timestamp: number;
}

interface PreservationRecord {
  id: string;
  sampleId: string;
  method: string;
  parameter: string;
  isCorrect: boolean;
  timestamp: number;
}

interface OperationError {
  id: string;
  phase: string;
  description: string;
  deduction: number;
  timestamp: number;
}

interface SimulationState {
  phase: SimulationPhaseType;
  riverConfig: RiverConfig;
  selectedPoints: SamplingPoint[];
  selectedEquipment: Equipment[];
  samplingOperations: SamplingOperation[];
  fieldMeasurements: FieldMeasurement[];
  preservationMethods: PreservationRecord[];
  errors: OperationError[];
  startTime: number;
  elapsedTime: number;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
  warnings?: string[];
}

interface SimulationConfig {
  taskId: string;
  riverConfig: RiverConfig;
  monitoringParameters: string[];
}

// ============ Default Configuration ============

const DEFAULT_RIVER_CONFIG: RiverConfig = {
  width: 50,
  depth: 2,
  flowDirection: 'right',
  pollutionSource: { x: 100, y: 150, type: 'industrial' },
  landmarks: [
    { x: 50, y: 50, name: '工业园区' },
    { x: 200, y: 100, name: '监测断面' }
  ]
};

const STORAGE_KEY = 'water_sampling_simulation_state';

// ============ Helper Functions ============

function createInitialState(riverConfig: RiverConfig = DEFAULT_RIVER_CONFIG): SimulationState {
  return {
    phase: SimulationPhase.POINT_SELECTION,
    riverConfig: { ...riverConfig },
    selectedPoints: [],
    selectedEquipment: [],
    samplingOperations: [],
    fieldMeasurements: [],
    preservationMethods: [],
    errors: [],
    startTime: Date.now(),
    elapsedTime: 0
  };
}

// ============ HJ/T 91-2002 Validation Rules ============

const HJT91_VALIDATION_RULES = {
  minDistanceFromBankRatio: 0.1,
  surfaceDepthMaxRatio: 0.2,
  surfaceDepthAbsoluteMax: 0.5,
  middleDepthMinRatio: 0.4,
  middleDepthMaxRatio: 0.6,
  bottomDepthMinRatio: 0.8,
  bottomDepthFromBottomMax: 0.5,
  narrowRiverMaxWidth: 50,
  mediumRiverMaxWidth: 100,
  narrowRiverMinPoints: 1,
  mediumRiverMinPoints: 2,
  wideRiverMinPoints: 3
};

/**
 * Validate sampling point according to HJ/T 91-2002 standard
 */
function validateSamplingPointHJT91(
  point: { position: { x: number; y: number; depth: number }; type: 'surface' | 'middle' | 'bottom' },
  riverConfig: RiverConfig
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rules = HJT91_VALIDATION_RULES;

  // 1. Check if within river bounds
  if (point.position.x < 0 || point.position.x > riverConfig.width) {
    return { 
      isValid: false, 
      message: '【HJ/T 91-2002】采样点位超出河流范围：横向位置必须在0到河宽之间',
      warnings: []
    };
  }

  // 2. Check depth validity
  if (point.position.depth < 0) {
    return { 
      isValid: false, 
      message: '【HJ/T 91-2002】采样深度无效：深度不能为负值',
      warnings: []
    };
  }
  
  if (point.position.depth > riverConfig.depth) {
    return { 
      isValid: false, 
      message: '【HJ/T 91-2002】采样深度超出水深范围：采样深度不能超过河流水深',
      warnings: []
    };
  }

  // 3. Check distance from bank
  const distanceFromLeftBank = point.position.x;
  const distanceFromRightBank = riverConfig.width - point.position.x;
  const distanceFromBank = Math.min(distanceFromLeftBank, distanceFromRightBank);
  const minDistanceFromBank = riverConfig.width * rules.minDistanceFromBankRatio;
  
  if (distanceFromBank < minDistanceFromBank) {
    const nearBank = distanceFromLeftBank < distanceFromRightBank ? '左岸' : '右岸';
    warnings.push(
      `【HJ/T 91-2002 4.2.2】采样点距${nearBank}过近（${distanceFromBank.toFixed(1)}m），` +
      `建议距岸距离不小于河宽的10%（${minDistanceFromBank.toFixed(1)}m），以避免岸边效应影响水样代表性`
    );
  }

  // 4. Check depth ratio based on sampling type
  if (point.type === 'surface') {
    const maxSurfaceDepth = Math.min(
      riverConfig.depth * rules.surfaceDepthMaxRatio,
      rules.surfaceDepthAbsoluteMax
    );
    
    if (point.position.depth > maxSurfaceDepth) {
      warnings.push(
        `【HJ/T 91-2002 4.3.1】表层采样深度过深（${point.position.depth.toFixed(2)}m），` +
        `表层采样应在水面下0.3-0.5m或水深的20%以内（建议≤${maxSurfaceDepth.toFixed(2)}m）`
      );
    }
  } else if (point.type === 'middle') {
    const minMiddleDepth = riverConfig.depth * rules.middleDepthMinRatio;
    const maxMiddleDepth = riverConfig.depth * rules.middleDepthMaxRatio;
    
    if (point.position.depth < minMiddleDepth || point.position.depth > maxMiddleDepth) {
      warnings.push(
        `【HJ/T 91-2002 4.3.2】中层采样深度不在推荐范围内（当前${point.position.depth.toFixed(2)}m），` +
        `中层采样应在水深的40%-60%处（${minMiddleDepth.toFixed(2)}m - ${maxMiddleDepth.toFixed(2)}m）`
      );
    }
  } else if (point.type === 'bottom') {
    const minBottomDepth = riverConfig.depth * rules.bottomDepthMinRatio;
    const distanceFromBottom = riverConfig.depth - point.position.depth;
    
    if (point.position.depth < minBottomDepth) {
      warnings.push(
        `【HJ/T 91-2002 4.3.3】底层采样深度不足（当前${point.position.depth.toFixed(2)}m），` +
        `底层采样应在水深的80%以上（建议≥${minBottomDepth.toFixed(2)}m）`
      );
    }
    
    if (distanceFromBottom > rules.bottomDepthFromBottomMax) {
      warnings.push(
        `【HJ/T 91-2002 4.3.3】底层采样距河底过远（${distanceFromBottom.toFixed(2)}m），` +
        `底层采样应距河底0.5m以内`
      );
    }
  }

  // 5. Check river width and sampling point placement
  if (riverConfig.width <= rules.narrowRiverMaxWidth) {
    const centerX = riverConfig.width / 2;
    const distanceFromCenter = Math.abs(point.position.x - centerX);
    const maxDistanceFromCenter = riverConfig.width * 0.2;
    
    if (distanceFromCenter > maxDistanceFromCenter) {
      warnings.push(
        `【HJ/T 91-2002 4.2.1】对于宽度≤50m的小河，建议在河流中心线附近采样，` +
        `当前点位偏离中心${distanceFromCenter.toFixed(1)}m`
      );
    }
  }

  const isValid = errors.length === 0;
  let message = '';
  
  if (!isValid) {
    message = errors.join('; ');
  } else if (warnings.length > 0) {
    message = warnings.join('\n');
  } else {
    message = '点位符合HJ/T 91-2002规范要求';
  }

  return { isValid, message, warnings };
}

// ============ WaterSamplingSimulation Class (extracted for testing) ============

class WaterSamplingSimulation {
  private _state: SimulationState | null = null;
  private _config: SimulationConfig | null = null;
  private _listeners: Array<(state: SimulationState) => void> = [];

  constructor(config: SimulationConfig | null = null) {
    this._config = config;
  }

  init(config: SimulationConfig): void {
    this._config = config;
    const riverConfig = config?.riverConfig || DEFAULT_RIVER_CONFIG;
    this._state = createInitialState(riverConfig);
    this._saveState();
    this._notifyListeners();
  }

  getState(): SimulationState | null {
    if (!this._state) {
      this._loadState();
    }
    return this._state ? { ...this._state } : null;
  }

  getPhase(): SimulationPhaseType {
    return this._state?.phase || SimulationPhase.POINT_SELECTION;
  }

  setPhase(phase: SimulationPhaseType): ValidationResult {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const validationResult = this._validatePhaseTransition(this._state.phase, phase);
    if (!validationResult.isValid) {
      return validationResult;
    }

    this._state.phase = phase;
    this._state.elapsedTime = Date.now() - this._state.startTime;
    this._saveState();
    this._notifyListeners();

    return { isValid: true, message: `已进入${phase}阶段` };
  }

  private _validatePhaseTransition(currentPhase: SimulationPhaseType, targetPhase: SimulationPhaseType): ValidationResult {
    const currentIndex = SIMULATION_PHASE_ORDER.indexOf(currentPhase);
    const targetIndex = SIMULATION_PHASE_ORDER.indexOf(targetPhase);

    if (targetIndex === -1) {
      return { isValid: false, message: '无效的目标阶段' };
    }

    if (targetIndex <= currentIndex + 1) {
      return { isValid: true };
    }

    return { 
      isValid: false, 
      message: `不能从${currentPhase}直接跳转到${targetPhase}` 
    };
  }

  nextPhase(): ValidationResult {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const currentIndex = SIMULATION_PHASE_ORDER.indexOf(this._state.phase);
    if (currentIndex >= SIMULATION_PHASE_ORDER.length - 1) {
      return { isValid: false, message: '已经是最后阶段' };
    }

    const nextPhase = SIMULATION_PHASE_ORDER[currentIndex + 1];
    return this.setPhase(nextPhase);
  }

  previousPhase(): ValidationResult {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const currentIndex = SIMULATION_PHASE_ORDER.indexOf(this._state.phase);
    if (currentIndex <= 0) {
      return { isValid: false, message: '已经是第一阶段' };
    }

    const prevPhase = SIMULATION_PHASE_ORDER[currentIndex - 1];
    return this.setPhase(prevPhase);
  }

  addSamplingPoint(point: Partial<SamplingPoint> & { position: { x: number; y: number; depth: number }; type: 'surface' | 'middle' | 'bottom' }): ValidationResult {
    if (!this._state) {
      return { isValid: false, message: '仿真未初始化' };
    }

    const validation = this._validateSamplingPoint(point);
    
    const pointWithValidation: SamplingPoint = {
      id: point.id || `point-${Date.now()}`,
      sectionId: point.sectionId || 'section-1',
      position: point.position,
      type: point.type,
      isValid: validation.isValid,
      validationMessage: validation.message
    };

    this._state.selectedPoints.push(pointWithValidation);
    
    if (!validation.isValid) {
      this._addError('point_selection', validation.message || 'Invalid point', 5);
    }

    this._saveState();
    this._notifyListeners();

    return validation;
  }

  private _validateSamplingPoint(point: Partial<SamplingPoint> & { position: { x: number; y: number; depth: number }; type: 'surface' | 'middle' | 'bottom' }): ValidationResult {
    return validateSamplingPointHJT91(point, this._state!.riverConfig);
  }

  selectEquipment(equipment: Equipment): void {
    if (!this._state) return;

    const exists = this._state.selectedEquipment.some(e => e.id === equipment.id);
    if (!exists) {
      this._state.selectedEquipment.push({ ...equipment });
      this._saveState();
      this._notifyListeners();
    }
  }

  removeEquipment(equipmentId: string): boolean {
    if (!this._state) return false;

    const index = this._state.selectedEquipment.findIndex(e => e.id === equipmentId);
    if (index === -1) return false;

    this._state.selectedEquipment.splice(index, 1);
    this._saveState();
    this._notifyListeners();
    return true;
  }

  getSelectedEquipment(): Equipment[] {
    if (!this._state) return [];
    return [...this._state.selectedEquipment];
  }

  hasEquipment(equipmentId: string): boolean {
    if (!this._state) return false;
    return this._state.selectedEquipment.some(e => e.id === equipmentId);
  }

  clearToolbox(): void {
    if (!this._state) return;
    this._state.selectedEquipment = [];
    this._saveState();
    this._notifyListeners();
  }

  getToolboxCount(): number {
    if (!this._state) return 0;
    return this._state.selectedEquipment.length;
  }

  private _addError(phase: string, description: string, deduction: number): void {
    this._state!.errors.push({
      id: `error-${Date.now()}`,
      phase,
      description,
      deduction,
      timestamp: Date.now()
    });
  }

  reset(): void {
    const riverConfig = this._config?.riverConfig || DEFAULT_RIVER_CONFIG;
    this._state = createInitialState(riverConfig);
    this._saveState();
    this._notifyListeners();
  }

  subscribe(listener: (state: SimulationState) => void): () => void {
    this._listeners.push(listener);
    return () => {
      const index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    };
  }

  private _notifyListeners(): void {
    const state = this.getState();
    if (state) {
      this._listeners.forEach(listener => {
        try {
          listener(state);
        } catch (e) {
          console.error('Listener error:', e);
        }
      });
    }
  }

  private _saveState(): void {
    if (!this._state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.error('Failed to save simulation state:', e);
    }
  }

  private _loadState(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this._state = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load simulation state:', e);
      this._state = null;
    }
  }

  clearSavedState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear simulation state:', e);
    }
    this._state = null;
  }

  hasSavedState(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (e) {
      return false;
    }
  }

  restoreSavedState(): boolean {
    this._loadState();
    if (this._state) {
      this._notifyListeners();
      return true;
    }
    return false;
  }
}

// ============ Unit Tests ============

describe('WaterSamplingSimulation', () => {
  let simulation: WaterSamplingSimulation;

  beforeEach(() => {
    mockLocalStorage.clear();
    simulation = new WaterSamplingSimulation();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default river config', () => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: ['pH', 'DO']
      });

      const state = simulation.getState();
      expect(state).not.toBeNull();
      expect(state!.phase).toBe(SimulationPhase.POINT_SELECTION);
      expect(state!.riverConfig.width).toBe(50);
      expect(state!.riverConfig.depth).toBe(2);
    });

    it('should start with empty collections', () => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });

      const state = simulation.getState();
      expect(state!.selectedPoints).toHaveLength(0);
      expect(state!.selectedEquipment).toHaveLength(0);
      expect(state!.samplingOperations).toHaveLength(0);
      expect(state!.fieldMeasurements).toHaveLength(0);
      expect(state!.preservationMethods).toHaveLength(0);
      expect(state!.errors).toHaveLength(0);
    });
  });

  describe('Phase Transitions', () => {
    beforeEach(() => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });
    });

    it('should allow transition to next phase', () => {
      const result = simulation.nextPhase();
      expect(result.isValid).toBe(true);
      expect(simulation.getPhase()).toBe(SimulationPhase.EQUIPMENT_PREP);
    });

    it('should allow transition to previous phase', () => {
      simulation.nextPhase(); // Go to equipment_prep
      const result = simulation.previousPhase();
      expect(result.isValid).toBe(true);
      expect(simulation.getPhase()).toBe(SimulationPhase.POINT_SELECTION);
    });

    it('should not allow skipping phases', () => {
      const result = simulation.setPhase(SimulationPhase.SAMPLING);
      expect(result.isValid).toBe(false);
    });

    it('should not allow going before first phase', () => {
      const result = simulation.previousPhase();
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('已经是第一阶段');
    });

    it('should not allow going past last phase', () => {
      // Go through all phases
      for (let i = 0; i < SIMULATION_PHASE_ORDER.length - 1; i++) {
        simulation.nextPhase();
      }
      const result = simulation.nextPhase();
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('已经是最后阶段');
    });
  });

  describe('State Persistence', () => {
    it('should save state to localStorage', () => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });

      expect(simulation.hasSavedState()).toBe(true);
    });

    it('should restore state from localStorage', () => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });
      simulation.nextPhase();

      // Create new instance and restore
      const newSimulation = new WaterSamplingSimulation();
      const restored = newSimulation.restoreSavedState();
      
      expect(restored).toBe(true);
      expect(newSimulation.getPhase()).toBe(SimulationPhase.EQUIPMENT_PREP);
    });

    it('should clear saved state', () => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });
      
      simulation.clearSavedState();
      expect(simulation.hasSavedState()).toBe(false);
    });
  });

  describe('Sampling Points', () => {
    beforeEach(() => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });
    });

    it('should add valid sampling point', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: 0.3 },
        type: 'surface'
      });

      expect(result.isValid).toBe(true);
      const state = simulation.getState();
      expect(state!.selectedPoints).toHaveLength(1);
    });

    it('should reject point outside river bounds', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 60, y: 100, depth: 0.3 }, // x > width (50)
        type: 'surface'
      });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('采样点位超出河流范围');
    });

    it('should reject point with invalid depth', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: 3 }, // depth > riverDepth (2)
        type: 'surface'
      });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('采样深度超出水深范围');
    });

    it('should warn when point is too close to bank', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 2, y: 100, depth: 0.3 }, // x < 10% of width (5m)
        type: 'surface'
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings!.some(w => w.includes('距') && w.includes('过近'))).toBe(true);
    });

    it('should warn when surface sampling depth is too deep', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: 0.6 }, // > 20% of depth (0.4m) and > 0.5m absolute
        type: 'surface'
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('表层采样深度过深'))).toBe(true);
    });

    it('should warn when middle sampling depth is out of range', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: 0.5 }, // < 40% of depth (0.8m)
        type: 'middle'
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('中层采样深度不在推荐范围内'))).toBe(true);
    });

    it('should warn when bottom sampling depth is insufficient', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: 1.0 }, // < 80% of depth (1.6m)
        type: 'bottom'
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('底层采样深度不足'))).toBe(true);
    });

    it('should reject point with negative depth', () => {
      const result = simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: -0.5 },
        type: 'surface'
      });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('深度不能为负值');
    });
  });

  describe('Equipment Selection', () => {
    beforeEach(() => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });
    });

    it('should add equipment to toolbox', () => {
      const equipment: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };

      simulation.selectEquipment(equipment);
      const state = simulation.getState();
      expect(state!.selectedEquipment).toHaveLength(1);
      expect(state!.selectedEquipment[0].id).toBe('bottle-1');
    });

    it('should not add duplicate equipment', () => {
      const equipment: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };

      simulation.selectEquipment(equipment);
      simulation.selectEquipment(equipment);
      const state = simulation.getState();
      expect(state!.selectedEquipment).toHaveLength(1);
    });

    it('should remove equipment from toolbox', () => {
      const equipment: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };

      simulation.selectEquipment(equipment);
      const removed = simulation.removeEquipment('bottle-1');
      
      expect(removed).toBe(true);
      const state = simulation.getState();
      expect(state!.selectedEquipment).toHaveLength(0);
    });

    it('should return false when removing non-existent equipment', () => {
      const removed = simulation.removeEquipment('non-existent-id');
      expect(removed).toBe(false);
    });

    it('should get selected equipment from toolbox', () => {
      const equipment1: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };
      const equipment2: Equipment = {
        id: 'tool-1',
        name: '温度计',
        type: 'tool',
        material: '玻璃',
        suitableFor: ['temperature'],
        notes: '现场测定水温'
      };

      simulation.selectEquipment(equipment1);
      simulation.selectEquipment(equipment2);
      
      const selected = simulation.getSelectedEquipment();
      expect(selected).toHaveLength(2);
      expect(selected.map(e => e.id)).toContain('bottle-1');
      expect(selected.map(e => e.id)).toContain('tool-1');
    });

    it('should check if equipment is in toolbox', () => {
      const equipment: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };

      expect(simulation.hasEquipment('bottle-1')).toBe(false);
      simulation.selectEquipment(equipment);
      expect(simulation.hasEquipment('bottle-1')).toBe(true);
    });

    it('should clear all equipment from toolbox', () => {
      const equipment1: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };
      const equipment2: Equipment = {
        id: 'tool-1',
        name: '温度计',
        type: 'tool',
        material: '玻璃',
        suitableFor: ['temperature'],
        notes: '现场测定水温'
      };

      simulation.selectEquipment(equipment1);
      simulation.selectEquipment(equipment2);
      expect(simulation.getToolboxCount()).toBe(2);
      
      simulation.clearToolbox();
      expect(simulation.getToolboxCount()).toBe(0);
      expect(simulation.getSelectedEquipment()).toHaveLength(0);
    });

    it('should get toolbox count', () => {
      expect(simulation.getToolboxCount()).toBe(0);
      
      const equipment: Equipment = {
        id: 'bottle-1',
        name: '玻璃采样瓶',
        type: 'bottle',
        material: 'glass',
        volume: 500,
        suitableFor: ['pH', 'DO'],
        notes: '使用前需清洗'
      };

      simulation.selectEquipment(equipment);
      expect(simulation.getToolboxCount()).toBe(1);
    });
  });

  describe('State Subscription', () => {
    it('should notify listeners on state change', () => {
      let notifiedState: SimulationState | null = null;
      
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });

      simulation.subscribe((state) => {
        notifiedState = state;
      });

      simulation.nextPhase();
      
      expect(notifiedState).not.toBeNull();
      expect(notifiedState!.phase).toBe(SimulationPhase.EQUIPMENT_PREP);
    });

    it('should allow unsubscribing', () => {
      let callCount = 0;
      
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });

      const unsubscribe = simulation.subscribe(() => {
        callCount++;
      });

      simulation.nextPhase();
      expect(callCount).toBe(1);

      unsubscribe();
      simulation.nextPhase();
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      simulation.init({
        taskId: 'test-task',
        riverConfig: DEFAULT_RIVER_CONFIG,
        monitoringParameters: []
      });

      simulation.nextPhase();
      simulation.addSamplingPoint({
        position: { x: 25, y: 100, depth: 0.3 },
        type: 'surface'
      });

      simulation.reset();

      const state = simulation.getState();
      expect(state!.phase).toBe(SimulationPhase.POINT_SELECTION);
      expect(state!.selectedPoints).toHaveLength(0);
    });
  });
});

// ============ Equipment Matching Validation ============

/**
 * Equipment database for testing (matching the implementation)
 */
const EQUIPMENT_DATABASE: Equipment[] = [
  // Bottles
  {
    id: 'bottle-glass-500',
    name: '玻璃采样瓶',
    type: 'bottle',
    material: '硼硅玻璃',
    volume: 500,
    suitableFor: ['pH', 'DO', 'BOD', 'COD', 'oil', 'volatile'],
    notes: '适用于有机物分析，使用前需酸洗'
  },
  {
    id: 'bottle-pe-1000',
    name: '聚乙烯瓶',
    type: 'bottle',
    material: '高密度聚乙烯(HDPE)',
    volume: 1000,
    suitableFor: ['heavy_metals', 'nutrients', 'anions', 'cations'],
    notes: '适用于重金属和无机离子分析，避免玻璃吸附'
  },
  {
    id: 'bottle-bod-300',
    name: 'BOD瓶',
    type: 'bottle',
    material: '玻璃',
    volume: 300,
    suitableFor: ['BOD', 'DO'],
    notes: '专用于BOD和溶解氧测定，磨口玻璃塞'
  },
  // Preservatives
  {
    id: 'preservative-hno3',
    name: '硝酸(HNO₃)',
    type: 'preservative',
    material: '优级纯硝酸',
    suitableFor: ['heavy_metals'],
    notes: '加酸至pH<2，用于重金属样品固定'
  },
  {
    id: 'preservative-h2so4',
    name: '硫酸(H₂SO₄)',
    type: 'preservative',
    material: '优级纯硫酸',
    suitableFor: ['COD', 'ammonia', 'oil'],
    notes: '加酸至pH<2，用于COD、氨氮等样品固定'
  },
  {
    id: 'preservative-mnso4',
    name: '硫酸锰溶液',
    type: 'preservative',
    material: '硫酸锰+碱性碘化钾',
    suitableFor: ['DO'],
    notes: '溶解氧固定剂，现场固定'
  },
  // Tools
  {
    id: 'tool-thermometer',
    name: '温度计',
    type: 'tool',
    material: '玻璃/电子',
    suitableFor: ['temperature'],
    notes: '现场测定水温，精度0.1°C'
  },
  {
    id: 'tool-ph-meter',
    name: 'pH计',
    type: 'tool',
    material: '便携式电子',
    suitableFor: ['pH'],
    notes: '现场测定pH值，使用前需校准'
  },
  {
    id: 'tool-do-meter',
    name: '溶解氧仪',
    type: 'tool',
    material: '便携式电子',
    suitableFor: ['DO'],
    notes: '现场测定溶解氧，使用前需校准'
  },
  {
    id: 'tool-ice-box',
    name: '冷藏箱',
    type: 'tool',
    material: '保温材料',
    suitableFor: ['refrigeration', 'all'],
    notes: '样品冷藏保存，保持4°C以下'
  },
  {
    id: 'tool-label',
    name: '标签纸',
    type: 'tool',
    material: '防水标签',
    suitableFor: ['all'],
    notes: '样品标识，记录采样信息'
  }
];

/**
 * Equipment matching rules for testing (matching the implementation)
 */
const EQUIPMENT_MATCHING_RULES: Record<string, {
  requiredBottle: string[];
  requiredPreservative: string[];
  requiredTools: string[];
  optionalSampler?: string[];
  description: string;
}> = {
  'heavy_metals': {
    requiredBottle: ['bottle-pe-1000'],
    requiredPreservative: ['preservative-hno3'],
    requiredTools: ['tool-ice-box', 'tool-label'],
    description: '重金属采样需使用聚乙烯瓶（避免玻璃吸附），加硝酸固定至pH<2'
  },
  'pH': {
    requiredBottle: ['bottle-glass-500'],
    requiredPreservative: [],
    requiredTools: ['tool-ph-meter', 'tool-label'],
    description: 'pH需现场测定，不需保存剂'
  },
  'DO': {
    requiredBottle: ['bottle-bod-300'],
    requiredPreservative: ['preservative-mnso4'],
    requiredTools: ['tool-do-meter', 'tool-label'],
    optionalSampler: ['sampler-horizontal'],
    description: '溶解氧需现场固定或测定，使用BOD瓶和横式采样器'
  },
  'COD': {
    requiredBottle: ['bottle-glass-500'],
    requiredPreservative: ['preservative-h2so4'],
    requiredTools: ['tool-ice-box', 'tool-label'],
    description: 'COD样品需加硫酸固定并冷藏保存'
  },
  'temperature': {
    requiredBottle: [],
    requiredPreservative: [],
    requiredTools: ['tool-thermometer'],
    description: '水温需现场测定'
  }
};

interface EquipmentValidationResult extends ValidationResult {
  errors?: string[];
  rules?: { description: string };
}

/**
 * Validate equipment selection against monitoring parameter requirements
 */
function validateEquipmentSelection(
  selectedEquipment: Equipment[],
  monitoringParameter: string
): EquipmentValidationResult {
  const rules = EQUIPMENT_MATCHING_RULES[monitoringParameter];
  if (!rules) {
    return { isValid: true, message: '未知监测项目，无法验证器具匹配' };
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  const selectedIds = selectedEquipment.map(e => e.id);

  // Check required bottles
  if (rules.requiredBottle && rules.requiredBottle.length > 0) {
    const hasRequiredBottle = rules.requiredBottle.some(id => selectedIds.includes(id));
    if (!hasRequiredBottle) {
      const requiredNames = rules.requiredBottle
        .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
        .filter(Boolean)
        .join('或');
      errors.push(`缺少必需的采样瓶：${requiredNames}`);
    }
  }

  // Check required preservatives
  if (rules.requiredPreservative && rules.requiredPreservative.length > 0) {
    const hasRequiredPreservative = rules.requiredPreservative.some(id => selectedIds.includes(id));
    if (!hasRequiredPreservative) {
      const requiredNames = rules.requiredPreservative
        .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
        .filter(Boolean)
        .join('或');
      errors.push(`缺少必需的保存剂：${requiredNames}`);
    }
  }

  // Check required tools
  if (rules.requiredTools && rules.requiredTools.length > 0) {
    const missingTools = rules.requiredTools.filter(id => !selectedIds.includes(id));
    if (missingTools.length > 0) {
      const missingNames = missingTools
        .map(id => EQUIPMENT_DATABASE.find(e => e.id === id)?.name)
        .filter(Boolean)
        .join('、');
      warnings.push(`建议添加工具：${missingNames}`);
    }
  }

  // Check for unsuitable equipment
  selectedEquipment.forEach(equipment => {
    if (equipment.suitableFor && 
        !equipment.suitableFor.includes(monitoringParameter) && 
        !equipment.suitableFor.includes('all') && 
        !equipment.suitableFor.includes('general')) {
      warnings.push(`${equipment.name} 可能不适用于 ${monitoringParameter} 监测`);
    }
  });

  const isValid = errors.length === 0;
  let message = '';
  
  if (errors.length > 0) {
    message = errors.join('\n');
  } else if (warnings.length > 0) {
    message = warnings.join('\n');
  } else {
    message = `器具选择符合 ${monitoringParameter} 监测要求`;
  }

  return { isValid, message, warnings, errors, rules };
}

// ============ Equipment Matching Validation Tests ============

describe('Equipment Matching Validation', () => {
  describe('validateEquipmentSelection', () => {
    it('should return valid when correct equipment is selected for heavy_metals', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-pe-1000')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'preservative-hno3')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-ice-box')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-label')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'heavy_metals');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('器具选择符合');
    });

    it('should return invalid when required bottle is missing for heavy_metals', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'preservative-hno3')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-ice-box')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'heavy_metals');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('缺少必需的采样瓶'))).toBe(true);
    });

    it('should return invalid when required preservative is missing for heavy_metals', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-pe-1000')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-ice-box')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'heavy_metals');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('缺少必需的保存剂'))).toBe(true);
    });

    it('should return warning when optional tools are missing', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-pe-1000')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'preservative-hno3')!
        // Missing tool-ice-box and tool-label
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'heavy_metals');
      
      expect(result.isValid).toBe(true); // Still valid, just warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('建议添加工具'))).toBe(true);
    });

    it('should return warning when unsuitable equipment is selected', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-glass-500')!, // Glass bottle not suitable for heavy_metals
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-pe-1000')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'preservative-hno3')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'heavy_metals');
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('可能不适用于'))).toBe(true);
    });

    it('should return valid for pH monitoring with correct equipment', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-glass-500')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-ph-meter')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-label')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'pH');
      
      expect(result.isValid).toBe(true);
    });

    it('should return valid for DO monitoring with correct equipment', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-bod-300')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'preservative-mnso4')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-do-meter')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-label')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'DO');
      
      expect(result.isValid).toBe(true);
    });

    it('should return valid for unknown monitoring parameter', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-glass-500')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'unknown_parameter');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('未知监测项目');
    });

    it('should return valid for temperature monitoring with thermometer only', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-thermometer')!
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'temperature');
      
      expect(result.isValid).toBe(true);
    });

    it('should not warn for equipment with "all" in suitableFor', () => {
      const selectedEquipment = [
        EQUIPMENT_DATABASE.find(e => e.id === 'bottle-pe-1000')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'preservative-hno3')!,
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-ice-box')!, // Has 'all' in suitableFor
        EQUIPMENT_DATABASE.find(e => e.id === 'tool-label')!    // Has 'all' in suitableFor
      ];

      const result = validateEquipmentSelection(selectedEquipment, 'heavy_metals');
      
      // Should not have warnings about ice-box or label being unsuitable
      const unsuitableWarnings = result.warnings?.filter(w => 
        w.includes('冷藏箱') || w.includes('标签纸')
      ) || [];
      expect(unsuitableWarnings).toHaveLength(0);
    });
  });
});
