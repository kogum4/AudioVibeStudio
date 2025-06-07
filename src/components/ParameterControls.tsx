import { ParameterDefinition, effectParameterManager } from '../modules/visual/EffectParameters';

interface ParameterControlsProps {
  effectName: string;
  onParameterChange?: (paramName: string, value: any) => void;
}

export function ParameterControls({ effectName, onParameterChange }: ParameterControlsProps) {
  const definitions = effectParameterManager.getParameterDefinitions(effectName);
  const parameters = effectParameterManager.getParameters(effectName);

  const handleParameterChange = (paramName: string, value: any) => {
    effectParameterManager.setParameter(effectName, paramName, value);
    onParameterChange?.(paramName, value);
    
    // Save all current parameters to localStorage for export
    const allParams = effectParameterManager.getParameters(effectName);
    localStorage.setItem('effectParameters', JSON.stringify(allParams));
  };

  const renderControl = (definition: ParameterDefinition) => {
    const currentValue = parameters[definition.name] ?? definition.defaultValue;

    switch (definition.type) {
      case 'number':
        return (
          <input
            type="range"
            min={definition.min}
            max={definition.max}
            step={definition.step}
            value={currentValue}
            onChange={(e) => handleParameterChange(definition.name, parseFloat(e.target.value))}
          />
        );

      case 'color':
        return (
          <input
            type="color"
            value={currentValue}
            onChange={(e) => handleParameterChange(definition.name, e.target.value)}
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={currentValue}
            onChange={(e) => handleParameterChange(definition.name, e.target.checked)}
          />
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleParameterChange(definition.name, e.target.value)}
          >
            {definition.options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  const formatValue = (definition: ParameterDefinition, value: any) => {
    if (definition.type === 'number') {
      return value.toString();
    }
    if (definition.type === 'boolean') {
      return value ? 'On' : 'Off';
    }
    return value;
  };

  if (definitions.length === 0) {
    return (
      <div className="parameter-controls">
        <p className="no-parameters">No parameters available for this effect.</p>
      </div>
    );
  }

  return (
    <div className="parameter-controls">
      <h3>Effect Parameters</h3>
      <div className="parameters-grid">
        {definitions.map(definition => (
          <div key={definition.name} className="parameter">
            <div className="parameter-header">
              <label className="parameter-label">{definition.name}</label>
              {definition.type === 'number' && (
                <span className="parameter-value">
                  {formatValue(definition, parameters[definition.name] ?? definition.defaultValue)}
                </span>
              )}
            </div>
            <div className="parameter-control">
              {renderControl(definition)}
            </div>
            {definition.description && (
              <p className="parameter-description">{definition.description}</p>
            )}
          </div>
        ))}
      </div>
      
      <button 
        className="reset-btn"
        onClick={() => effectParameterManager.resetToDefaults(effectName)}
      >
        Reset to Defaults
      </button>
    </div>
  );
}