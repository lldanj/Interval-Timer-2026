import { Workout, Block, Interval } from '../types';
import { generateId } from './utils';

function powerToZone(power: number): string {
  if (power < 0.55) return '1';
  if (power < 0.75) return '2';
  if (power < 0.90) return '3';
  if (power < 1.05) return '4';
  if (power < 1.20) return '5';
  if (power < 1.50) return '6';
  return '7';
}

export function parseZWO(xmlString: string): Omit<Workout, 'id'> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  const name = xmlDoc.querySelector('name')?.textContent || 'Imported Workout';
  const workoutNode = xmlDoc.querySelector('workout');
  
  if (!workoutNode) {
    throw new Error("Invalid ZWO file: No workout data found.");
  }

  const blocks: Block[] = [];
  const children = Array.from(workoutNode.children);

  children.forEach((node) => {
    const tagName = node.tagName;
    
    if (tagName === 'SteadyState' || tagName === 'Warmup' || tagName === 'Cooldown') {
      const duration = parseInt(node.getAttribute('Duration') || '0');
      const power = parseFloat(node.getAttribute('Power') || node.getAttribute('PowerLow') || '0.5');
      
      blocks.push({
        id: generateId(),
        repeatCount: 1,
        intervals: [{
          id: generateId(),
          name: tagName,
          duration,
          zone: powerToZone(power),
          cadence: node.getAttribute('Cadence') || 'Any'
        }]
      });
    } else if (tagName === 'IntervalsT') {
      const repeatCount = parseInt(node.getAttribute('Repeat') || '1');
      const onDuration = parseInt(node.getAttribute('OnDuration') || '0');
      const offDuration = parseInt(node.getAttribute('OffDuration') || '0');
      const onPower = parseFloat(node.getAttribute('OnPower') || '1.0');
      const offPower = parseFloat(node.getAttribute('OffPower') || '0.5');
      const onCadence = node.getAttribute('OnCadence') || 'Any';
      const offCadence = node.getAttribute('OffCadence') || 'Any';

      blocks.push({
        id: generateId(),
        repeatCount,
        intervals: [
          {
            id: generateId(),
            name: 'Work',
            duration: onDuration,
            zone: powerToZone(onPower),
            cadence: onCadence
          },
          {
            id: generateId(),
            name: 'Rest',
            duration: offDuration,
            zone: powerToZone(offPower),
            cadence: offCadence
          }
        ]
      });
    } else if (tagName === 'Ramp') {
      const duration = parseInt(node.getAttribute('Duration') || '0');
      const powerLow = parseFloat(node.getAttribute('PowerLow') || '0.5');
      const powerHigh = parseFloat(node.getAttribute('PowerHigh') || '0.8');
      const avgPower = (powerLow + powerHigh) / 2;

      blocks.push({
        id: generateId(),
        repeatCount: 1,
        intervals: [{
          id: generateId(),
          name: 'Ramp',
          duration,
          zone: powerToZone(avgPower),
          cadence: node.getAttribute('Cadence') || 'Any'
        }]
      });
    }
  });

  return {
    name,
    blocks
  };
}
