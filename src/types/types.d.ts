export interface Planet {
  _id?: string,
  planet: string,
  diameter?: number,
}

export interface RealmV2 {
  order?: number,
  _id?: string,
  title: string,
  description: string,
  value: string,
  creation?: Date,
  initialTime?: number, // read only - start initial time
  // next session initial time is calculated from this 
  restTime?: number, // modifiable - 10s by default
  beepTime?: number, // modifiable - 4s by default (2 initial 2 end)
  tasksPerSession?: number, // modifiable - 10 by default
  totalExperience?: number, // updated every session
  sessions?: SessionRecord[],
  context?: string, // for spotify stuff
  shuffled?: boolean, // for spotify stuff
  hardcap?: number // in seconds, but should be minutes, meanwhile we use an excel calculator
}

// export interface Alarm {
//   _id?: string,
//   start: string; // 'HH:mm'
//   end?: string; // 'HH:mm'
//   startDate?: string // 'yyyy-MM-dd'
//   endDate?: string // 'yyyy-MM-dd'
//   weekdays: [] // 0 - sunday | 6 - saturday
//   value: string,
//   group?: string,
//   //
//   playlist?: string,
// }

export interface Alarm {
  _id?: string,
  start: string; // 'HH:mm'
  end?: string; // 'HH:mm'
  startDate?: string // 'yyyy-MM-dd'
  endDate?: string // 'yyyy-MM-dd'
  weekdays: [] // 0 - sunday | 6 - saturday
  task?: Task
  //
  group?: string,
  value?: string,
  playlist?: string,
}

export type Task =
  {
    type: 'timer'
    value: string
  }
  | {
    type: 'queue'
    value: string[]
  }
  | {
    type: 'spotify'
    value: string
  }
  | {
    type: 'sound'
    value: string
  }
  | {
    type: 'webpage'
    value: string
  }

export interface StudyObject {
  _id?: string,
  name: string,
  start: string, // 'yyyy-MM-DD'
  toc: string[],
  smConfig?: Object
}