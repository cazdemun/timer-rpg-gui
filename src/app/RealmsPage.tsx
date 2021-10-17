import React from 'react';
import { Repository } from '../types/Repository';
import { Alarm, RealmV2 as Realm } from '../types/types';
import { assign, createMachine, Event, EventData, State } from 'xstate';
import { useMachine } from '@xstate/react';
import { Table, Row, Col, Button, message, Form, Layout, Modal, Input, Checkbox } from 'antd';
import { CopyOutlined, EditOutlined, DeleteOutlined, PlusSquareOutlined } from '@ant-design/icons';

import 'antd/dist/antd.css';

const Realms = new Repository<Realm>('realms');

const realmsColumns = (send: any) => [
  {
    title: 'Id',
    dataIndex: '_id',
    key: 'name',
  },
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Value',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: 'Operation',
    dataIndex: 'operation',
    render: (_: any, record: any) => <Row>
      <Button icon={<EditOutlined />}
        onClick={() => send('OPEN_EDIT_REALM_MODAL', {
          data: {
            realm: traceTag('OPEN_EDIT_REALM_MODAL')(record)
          }
        })} />
      <Button icon={<DeleteOutlined />}
        onClick={() => send('DELETE_REALM', {
          data: {
            realmId: traceTag('DELETE_REALM')(record._id)
          }
        })} />
    </Row>,
    width: 100,
  }
]

// The events that the machine handles
type LightEvent =
  | { type: 'CREATE_REALM' }
  | { type: 'OPEN_CREATE_REALM_MODAL' }
  | { type: 'EDIT_REALM', data: { realm: Realm } }
  | { type: 'OPEN_EDIT_REALM_MODAL', data: { realm: Realm } }
  | { type: 'DELETE_REALM', data: { realmId: string } }
  | { type: 'CLOSE_REALM_MODAL' }

// The context (extended state) of the machine
interface LightContext {
  realms: Realm[];
  realmToEdit?: Realm;
}

const lightMachine = createMachine<LightContext, LightEvent>({
  key: 'light',
  initial: 'loading',
  context: {
    realms: [],
    realmToEdit: undefined,
  },
  states: {
    loading: {
      invoke: {
        src: () => Realms.find({}),
        onDone: {
          target: 'idle',
          actions: assign((_, event) => ({
            realms: traceTag('loading')(event.data)
          }))
        }
      }
    },
    idle: {
      on: {
        'CREATE_REALM': 'creating',
        'DELETE_REALM': 'deletingService',
        'OPEN_EDIT_REALM_MODAL': {
          target: 'editing',
          actions: assign((_, event) => ({
            realmToEdit: traceTag('idle')(event.data.realm)
          }))
        }
      }
    },
    creating: {
      invoke: {
        src: () => Realms.insert({ title: 'Test', description: 'Test realm', value: 'test' })
          .then(traceTag('creating'))
          .then(_ => Realms.find({})),
        onDone: {
          target: 'idle',
          actions: assign((_, event) => ({
            realms: traceTag('creating')(event.data)
          }))
        }
      }
    },
    editing: {
      on: {
        'EDIT_REALM': 'editingService',
        'CLOSE_REALM_MODAL': 'idle'
      }
    },
    editingService: {
      invoke: {
        src: (_, event: any) => Realms.update(event.data.realm._id, event.data.realm),
        onDone: 'loading'
      },
    },
    deletingService: {
      invoke: {
        src: (_, event: any) => Realms.delete(event.data.realmId),
        onDone: 'loading'
      },
    },
  }
});

const trace = (x: any) => { console.log(x); return x; }
const traceTag_ = (flag: boolean) => (tag: string) => (x: any) => { if (flag) { console.log(tag, x); return x; } }
const traceTag = traceTag_(true);

type StateUseMachine = { current: State<LightContext, LightEvent>, send: (event: Event<LightEvent>, payload?: EventData | undefined) => State<LightContext, LightEvent> }

const RealmModal = ({ current, send }: StateUseMachine) => {
  const [form] = Form.useForm();
  return <Modal visible={current.matches('editing')}
    onOk={() => {
      form
        .validateFields()
        .then(values => {
          form.resetFields();
          console.log(values);
          console.log({ ...current.context.realmToEdit, ...values });
          const editedRealm = { ...current.context.realmToEdit, ...values };
          send('EDIT_REALM', { data: { realm: editedRealm } });
        })
        .catch(info => {
          console.log('Validate Failed:', info);
        });
    }}
    onCancel={() => send('CLOSE_REALM_MODAL')}>
    <pre>
      {JSON.stringify(current.context.realmToEdit, null, 2)}
    </pre>
    <Form
      name="basic"
      form={form}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      initialValues={current.context.realmToEdit}
      autoComplete="off"
    >
      <Form.Item
        label="Title"
        name="title"
        rules={[{ required: true, message: 'Please input you a title!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please input a description!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Value"
        name="value"
        rules={[{ required: true, message: 'Please input a value!' }]}
      >
        <Input />
      </Form.Item>
    </Form>
  </Modal>
}

const RealmsPage = () => {
  const [current, send] = useMachine(lightMachine);

  return (
    <Layout style={{ minHeight: '100%' }}>
      {current.matches('editing') ?
        <RealmModal current={current} send={send} /> : null
      }
      <Row>
        <Col span={24}>
          <Row justify='end'>
            <Button icon={<PlusSquareOutlined />} onClick={() => send('CREATE_REALM')} />
          </Row>
          <Table
            dataSource={current.context.realms.map((r: Realm) => ({ key: r._id, ...r }))}
            columns={realmsColumns(send)} />
        </Col>
        <Col span={24}>
          <Button icon={<CopyOutlined />} onClick={() => {
            message.success('Database was successfully copied 🎉');
            navigator.clipboard.writeText(current.context.realms.map(x => JSON.stringify(x)).join('\n'))
          }} />
          <pre>{current.context.realms.map(x => JSON.stringify(x)).join('\n')}</pre>
        </Col>
      </Row>
    </Layout>
  );
}

export default RealmsPage;
