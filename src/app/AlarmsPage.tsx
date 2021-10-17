import React, { useState } from 'react';
import moment from 'moment';
import { Repository } from '../types/Repository';
import { Alarm, Task } from '../types/types';
import { isAfter, isEqual, parse } from 'date-fns';
import { assign, createMachine, Event, EventData, State } from 'xstate';
import { useMachine } from '@xstate/react';
import { Table, Row, Col, Button, message, Form, Layout, Modal, Checkbox, TimePicker, DatePicker, Select, Tag } from 'antd';
import { CopyOutlined, EditOutlined, DeleteOutlined, PlusSquareOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';


import 'antd/dist/antd.css';

const Alarms = new Repository<Alarm>('alarms');

const HOUR_FORMAT = 'HH:mm';
const DATE_FORMAT = 'yyyy-MM-DD';

const dateStringSorter = (format: string) => (a: string, b: string) => {
  const aT = parse(a, format, new Date());
  const bT = parse(b, format, new Date());
  if (isEqual(aT, bT)) return 0;
  if (isAfter(aT, bT)) return 1;
  return -1;
}

const stringToColour = (str: string) => {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var j = 0; j < 3; j++) {
    var value = (hash >> (j * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

const alarmsColumns = (send: any) => [
  {
    title: 'Id',
    dataIndex: '_id',
    key: 'name',
    render: (s: string) => `${s.substr(0, 5)}...`,
    width: 50,
  },
  // {
  //   title: 'Value',
  //   dataIndex: 'value',
  //   key: 'value',
  //   filters: [
  //     { text: 'Fitness', value: 'fitness' },
  //     { text: 'Focus', value: 'focus' }
  //   ],
  //   onFilter: (value: any, record: any) => record.value === value,
  //   sorter: {
  //     compare: (a: Alarm, b: Alarm) => a.group?.localeCompare(b.group ?? '') ?? 0,
  //     multiple: 3,
  //   }
  // },
  {
    title: 'Task',
    dataIndex: 'task',
    key: 'task',
    render: (s: Task) => s ? <>
      {s.type === 'queue' ? s.value.map((tag, i) =>
        <Tag color={stringToColour(tag)} key={i}>
          {tag}
        </Tag>
      ) : <Tag color={stringToColour(s.value)}>{s.value}</Tag>}
    </> : '',
    width: 320,
  },
  {
    title: 'Start',
    dataIndex: 'start',
    key: 'start',
    sorter: {
      compare: (a: Alarm, b: Alarm) => dateStringSorter(HOUR_FORMAT)(a.start, b.start),
      multiple: 2,
    }
  },
  {
    title: 'End',
    dataIndex: 'end',
    key: 'end',
  },
  {
    title: 'Weekdays',
    dataIndex: 'weekdays',
    key: 'weekdays',
    render: (s: string[]) => `${s.join(",")}`,
    filters: [
      { text: 'Su', value: 0 },
      { text: 'M', value: 1 },
      { text: 'Tu', value: 2 },
      { text: 'W', value: 3 },
      { text: 'Th', value: 4 },
      { text: 'F', value: 5 },
      { text: 'Sa', value: 6 },
    ],
    onFilter: (value: any, record: any) => record.weekdays.length === 0 ? true : record.weekdays.includes(value),
  },
  {
    title: 'Operation',
    dataIndex: 'operation',
    render: (_: any, record: any) => <Row>
      <Button icon={<EditOutlined />}
        onClick={() => send('OPEN_EDIT_ALARM_MODAL', {
          data: {
            alarm: traceTag('OPEN_EDIT_ALARM_MODAL')(record)
          }
        })} />
      <Button icon={<DeleteOutlined />}
        onClick={() => send('DELETE_ALARM', {
          data: {
            alarmId: traceTag('DELETE_ALARM')(record._id)
          }
        })} />
      <Button icon={<CopyOutlined />}
        onClick={() => send('DUPLICATE_ALARM', {
          data: {
            alarm: traceTag('DUPLICATE_ALARM')({ ...record, key: undefined, _id: undefined })
          }
        })} />
    </Row>,
    width: 150,
  }
]

// The events that the machine handles
type LightEvent =
  | { type: 'CREATE_ALARM' }
  | { type: 'OPEN_CREATE_ALARM_MODAL' }
  | { type: 'EDIT_ALARM', data: { alarm: Alarm } }
  | { type: 'OPEN_EDIT_ALARM_MODAL', data: { alarm: Alarm } }
  | { type: 'DELETE_ALARM', data: { alarmId: string } }
  | { type: 'DUPLICATE_ALARM', data: { alarm: Alarm } }
  | { type: 'CLOSE_ALARM_MODAL' }

// The context (extended state) of the machine
interface LightContext {
  alarms: Alarm[];
  alarmToEdit?: Alarm;
}

const lightMachine = createMachine<LightContext, LightEvent>({
  key: 'light',
  initial: 'loading',
  context: {
    alarms: [],
    alarmToEdit: undefined,
  },
  states: {
    loading: {
      invoke: {
        src: () => Alarms.find({}),
        onDone: {
          target: 'idle',
          actions: assign((_, event) => ({
            alarms: traceTag('loading')(event.data)
          }))
        }
      }
    },
    idle: {
      on: {
        'CREATE_ALARM': 'creating',
        'DELETE_ALARM': 'deletingService',
        'DUPLICATE_ALARM': 'duplicatingService',
        'OPEN_EDIT_ALARM_MODAL': {
          target: 'editing',
          actions: assign((_, event) => ({
            alarmToEdit: traceTag('idle')(event.data.alarm)
          }))
        }
      }
    },
    creating: {
      invoke: {
        src: () => Alarms.insert({ start: '06:00', end: '07:00', value: 'test', weekdays: [] })
          .then(traceTag('creating'))
          .then(_ => Alarms.find({})),
        onDone: {
          target: 'idle',
          actions: assign((_, event) => ({
            alarms: traceTag('creating')(event.data)
          }))
        }
      }
    },
    editing: {
      on: {
        'EDIT_ALARM': 'editingService',
        'CLOSE_ALARM_MODAL': 'idle'
      }
    },
    editingService: {
      invoke: {
        src: (_, event: any) => Alarms.update(event.data.alarm._id, event.data.alarm),
        onDone: 'loading'
      },
    },
    deletingService: {
      invoke: {
        src: (_, event: any) => Alarms.delete(event.data.alarmId),
        onDone: 'loading'
      },
    },
    duplicatingService: {
      invoke: {
        src: (_, event: any) => Alarms.insert(event.data.alarm)
          .then(traceTag('creating'))
          .then(_ => Alarms.find({})),
        onDone: {
          target: 'idle',
          actions: assign((_, event) => ({
            alarms: traceTag('creating')(event.data)
          }))
        }
      },
    },
  }
});

// const trace = (x: any) => { console.log(x); return x; }
const traceTag_ = (flag: boolean) => (tag: string) => (x: any) => { if (flag) { console.log(tag, x); return x; } }
const traceTag = traceTag_(true);

type StateUseMachine = { current: State<LightContext, LightEvent>, send: (event: Event<LightEvent>, payload?: EventData | undefined) => State<LightContext, LightEvent> }

const AlarmModal = ({ current, send }: StateUseMachine) => {
  const [form] = Form.useForm();
  const [taskType, setTaskType] = useState<"timer" | "queue" | "spotify" | "sound" | "webpage">(current.context.alarmToEdit?.task?.type ?? 'timer');

  const initialValues = traceTag('initialValues')({
    ...current.context.alarmToEdit,
    task: current.context.alarmToEdit?.task?.type ?? 'timer',
    taskValue: current.context.alarmToEdit?.task?.value ?? '',
    start: current.context.alarmToEdit?.start
      ? moment(current.context.alarmToEdit.start, HOUR_FORMAT) : undefined,
    end: current.context.alarmToEdit?.end
      ? moment(current.context.alarmToEdit.end, HOUR_FORMAT) : undefined,
    startDate: current.context.alarmToEdit?.startDate
      ? moment(current.context.alarmToEdit.startDate, DATE_FORMAT) : undefined,
    endDate: current.context.alarmToEdit?.endDate
      ? moment(current.context.alarmToEdit.endDate, DATE_FORMAT) : undefined,
  })

  const onOk = () => {
    form
      .validateFields()
      .then(values => {
        form.resetFields();
        console.log(values);
        const editedAlarm = traceTag('validateFields')({
          ...current.context.alarmToEdit,
          ...values,
          // remane values.task to values.taskType
          task: { type: values.task, value: values.taskValue },
          start: values.start?.format(HOUR_FORMAT) ?? undefined,
          end: values.end?.format(HOUR_FORMAT) ?? undefined,
          startDate: values.startDate?.format(DATE_FORMAT) ?? undefined,
          endDate: values.endDate?.format(DATE_FORMAT) ?? undefined,
          taskValue: undefined,
          key: undefined,
          // temp
          value: undefined
        });
        send('EDIT_ALARM', { data: { alarm: editedAlarm } });
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  }

  const onCancel = () => send('CLOSE_ALARM_MODAL')

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 4 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 20 },
    },
  };
  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      xs: { span: 24, offset: 0 },
      sm: { span: 20, offset: 4 },
    },
  };

  const realmsOptions = [
    { value: "fitness", label: "Exercise" },
    { value: "work", label: "Work" },
    { value: "worklite", label: "Work Lite" },
    { value: "focus", label: "Focus" },
    { value: "life", label: "Life Management" },
    { value: "studies", label: "Studies" },
    { value: "inspiration", label: "Inspiration" },
    { value: "chores", label: "Chores" },
    { value: "music", label: "Music" },
  ]

  return <Modal visible={current.matches('editing')}
    onOk={onOk}
    onCancel={onCancel}>
    <Form
      name="basic"
      form={form}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
      initialValues={initialValues}
      autoComplete="off"
    >
      <Form.Item
        label="Start"
        name="start"
        rules={[{ required: true, message: 'Please input you a start time!' }]}
      >
        <TimePicker />
      </Form.Item>

      <Form.Item
        label="End"
        name="end"
      >
        <TimePicker />
      </Form.Item>

      <Form.Item
        label="Start Date"
        name="startDate"
      >
        <DatePicker />
      </Form.Item>

      <Form.Item
        label="End Date"
        name="endDate"
      >
        <DatePicker />
      </Form.Item>

      <Form.Item
        label="Weekdays"
        name="weekdays"
      >
        <Checkbox.Group options={[
          { value: 0, label: 'Su' },
          { value: 1, label: 'M' },
          { value: 2, label: 'Tu' },
          { value: 3, label: 'W' },
          { value: 4, label: 'Th' },
          { value: 5, label: 'F' },
          { value: 6, label: 'Sa' },
        ]} />
      </Form.Item>

      <Form.Item
        label="Task type"
        name="task"
      >
        <Select style={{ width: 150 }}
          onChange={(value: 'timer' | 'queue') => setTaskType(value)}>
          <Select.Option value="timer">Timer</Select.Option>
          <Select.Option value="queue">Queue</Select.Option>
        </Select>
      </Form.Item>

      {taskType === 'timer' ?
        <Form.Item
          label="Value"
          name="taskValue"
          rules={[{ required: true, message: 'Please input a value!' }]}
        >
          <Select style={{ width: 150 }}>
            {realmsOptions.map((r) => <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>)}
          </Select>
        </Form.Item> :
        <>
          <Form.List
            name="taskValue"
            rules={[
              {
                validator: async (_, names) => {
                  if (!names || names.length < 1) {
                    return Promise.reject(new Error('At least one timer'));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
                    label={index === 0 ? 'Values' : ''}
                    required={false}
                    key={field.key}
                  >
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[{ required: true, message: 'Please input a value!' }]}
                      noStyle
                    >
                      <Select style={{ width: '60%', marginRight: '5px' }}>
                        {realmsOptions.map((r) => <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined
                        className="dynamic-delete-button"
                        onClick={() => remove(field.name)}
                      />
                    ) : null}
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    style={{ width: '60%' }}
                    icon={<PlusOutlined />}
                  >
                    Add field
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
        </>
      }
    </Form>
  </Modal>
}

const AlarmsPage = () => {
  const [current, send] = useMachine(lightMachine);

  return (
    <Layout style={{ minHeight: '100%' }}>
      {current.matches('editing') ?
        <AlarmModal current={current} send={send} /> : null
      }
      <Row>
        <Col span={24}>
          <Row justify='end'>
            <Button icon={<PlusSquareOutlined />} onClick={() => send('CREATE_ALARM')} />
          </Row>
          <Table
            dataSource={current.context.alarms.map((r: Alarm) => ({ ...r, key: r._id, }))}
            columns={alarmsColumns(send)} />
        </Col>
        <Col span={24}>
          <Button icon={<CopyOutlined />} onClick={() => {
            message.success('Database was successfully copied 🎉');
            navigator.clipboard.writeText(current.context.alarms.map(x => JSON.stringify(x)).join('\n'))
          }} />
          <pre>{current.context.alarms.map(x => JSON.stringify(x)).join('\n')}</pre>
        </Col>
      </Row>
    </Layout>
  );
}

export default AlarmsPage;
