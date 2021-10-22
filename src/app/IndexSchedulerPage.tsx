// eslint-disable-next-line no-use-before-define
import React, { useState } from 'react';
import moment from 'moment';
import {
  Spin, Col, Layout, Row, Input, Calendar,
  Button, Badge, Form, DatePicker, Table,
} from 'antd';
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';
import { addDays, supermemoScheduleThree } from './Services/supermemo2';
import { StudyObject } from '../types/types';
import { Repository } from '../types/Repository';

// TODO - Modify SRS with form
const StudyObjects = new Repository<StudyObject>('studyobj');

interface SchedulerContext {
  studyObjects: StudyObject[],
  currentStudyObject: StudyObject
}

const defaultStudyObject: StudyObject = {
  name: 'Nameless Study Object',
  start: moment().format('yyyy-MM-DD'),
  toc: [],
};

const schedulerMachine = createMachine<SchedulerContext>({
  key: 'scheduler',
  initial: 'loading',
  context: {
    studyObjects: [],
    currentStudyObject: defaultStudyObject,
  },
  states: {
    loading: {
      invoke: {
        src: () => StudyObjects.find({}),
        onDone: {
          target: 'idle',
          actions: assign((_, event) => ({
            studyObjects: event.data,
          })),
        },
      },
    },
    idle: {
      on: {
        SAVE_STUDY_OBJECT: {
          target: 'savingStudyObject',
          actions: assign((_, event) => ({
            currentStudyObject: event.data.studyObject,
          })),
        },
        LOAD_STUDY_OBJECT: {
          target: 'loading',
          actions: assign((_, event) => ({
            currentStudyObject: event.data.studyObject,
          })),
        },
        CREATE_NEW_STUDY_OBJECT: {
          target: 'idle',
          actions: assign((_, __) => ({
            currentStudyObject: defaultStudyObject,
          })),
        },
      },
    },
    savingStudyObject: {
      invoke: {
        src: (context) => (context.currentStudyObject._id
          ? StudyObjects.update(context.currentStudyObject._id, context.currentStudyObject)
          : StudyObjects.insert(context.currentStudyObject)),
        onDone: 'loading',
      },
    },
  },
});

const ScheduleCalendar = ({ getListData }: any) => {
  const [calendarValue, setCalendarValue] = useState(moment());

  const dateCellRender = (value: moment.Moment) => {
    // console.log(value.format('yyyy-MM-DD'));
    const listData = getListData(value) ?? [];
    return (
      <ul>
        {listData.map((item: any) => (
          <li key={item.content} style={{ listStyle: 'none' }}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Col>
      <Row justify="end">
        <Button onClick={() => setCalendarValue(moment(calendarValue).add(-1, 'M'))}>{'<'}</Button>
        <Button onClick={() => setCalendarValue(moment(calendarValue).add(1, 'M'))}>{'>'}</Button>
      </Row>
      <Calendar
        value={calendarValue}
        onChange={(date: moment.Moment) => setCalendarValue(date)}
        onPanelChange={(date: moment.Moment) => setCalendarValue(date)}
        dateCellRender={dateCellRender}
      />
    </Col>
  );
};

const StudyObjectSchedulerPage = () => {
  const [current, send] = useMachine(schedulerMachine);

  const getListData = (toc: string[], initialDate: string) => (value: moment.Moment) => {
    if (toc.length === 0) return [];
    const key = value.format('yyyy-MM-DD');

    const mergedListData = toc
      .map((title, i) => {
        const titleDate = addDays(initialDate, i);
        return supermemoScheduleThree(titleDate, title);
      })
      .reduce((acc: any, x: any) => {
        Object.keys(x).forEach((k: string) => {
          acc[k] = (acc[k] ?? []).concat(x[k]);
        })
        return acc;
      }, {})

    return mergedListData[key];
  }

  return (
    <Layout>
      <Row gutter={16}>
        <Col sm={24} md={12} style={{ height: '500px' }}>
          {current.matches('idle') ? (
            <Form
              initialValues={{
                name: current.context.currentStudyObject.name,
                start: moment(current.context.currentStudyObject.start, 'yyyy-MM-DD'),
                toc: current.context.currentStudyObject.toc.join('\n')
              }}
              onFinish={(values) => {
                send('SAVE_STUDY_OBJECT',
                  {
                    data: {
                      studyObject: {
                        ...current.context.currentStudyObject,
                        name: values.name,
                        start: values.start.format('yyyy-MM-DD'),
                        toc: values.toc.split('\n'),
                      }
                    }
                  })
              }}>
              <Form.Item name='name' rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name='start' rules={[{ required: true }]}>
                <DatePicker />
              </Form.Item>
              <Form.Item name='toc' rules={[{ required: true }]}>
                <Input.TextArea style={{ height: '50%', minHeight: '300px' }} />
              </Form.Item>
              <Row justify='end'>
                <Button htmlType='submit'>Schedule</Button>
              </Row>
            </Form>
          )
            : <Spin size="large" />}
        </Col>
        <Col sm={24} md={12}>
          <Table dataSource={current.context.studyObjects
            .map(x => ({ ...x, key: x._id }))}
            onRow={(record) => ({
              onClick: (_) => {
                if (record._id === current.context.currentStudyObject._id)
                  return;
                send('LOAD_STUDY_OBJECT',
                  {
                    data: {
                      studyObject: record
                    }
                  })
              },
            })}
            pagination={{ pageSize: 5 }}
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Start',
                dataIndex: 'start',
                key: 'start',
              }
            ]} />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <ScheduleCalendar
            getListData={getListData(
              current.context.currentStudyObject.toc,
              current.context.currentStudyObject.start
            )} />
        </Col>
      </Row>
    </Layout>
  );
}

export default StudyObjectSchedulerPage;