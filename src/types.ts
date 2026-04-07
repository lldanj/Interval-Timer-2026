export interface Interval {
  id: string;
  name: string;
  duration: number; // seconds
  zone: string;
  cadence: string;
}

export interface Block {
  id: string;
  repeatCount: number;
  intervals: Interval[];
}

export interface Workout {
  id: string;
  name: string;
  blocks: Block[];
}

export interface FlattenedInterval extends Interval {
  blockId: string;
  blockRepeatIndex: number;
  intervalIndexInBlock: number;
  totalIndex: number;
}
