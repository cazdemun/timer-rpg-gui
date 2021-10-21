import React from 'react';
import AlarmsPage from './app/AlarmsPage';

import 'antd/dist/antd.css';
import { createMachine } from 'xstate';
import { useMachine } from '@xstate/react';
import { Layout, Menu } from 'antd';
import IndexSchedulerPage from './app/IndexSchedulerPage';

const { Header, Footer, Content } = Layout;

type NavEvent =
  | { type: 'TO_ALARM_PAGE' }
  | { type: 'TO_REALM_PAGE' }
  | { type: 'TO_INDEX_SCHEDULER_PAGE' }


interface NavContext {
}

const navMachine = createMachine<NavContext, NavEvent>({
  key: 'navigation',
  // initial: 'alarmPage',
  initial: 'indexSchedulerPage',
  context: {},
  states: {
    alarmPage: {},
    realmPage: {},
    indexSchedulerPage: {},
  },
  on: {
    'TO_ALARM_PAGE': 'alarmPage',
    'TO_REALM_PAGE': 'realmPage',
    'TO_INDEX_SCHEDULER_PAGE': 'indexSchedulerPage',
  }
})


function App() {
  const [current, send] = useMachine(navMachine);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <div className="logo" />
        {/* <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['0']}> */}
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
          <Menu.Item key={'0'} onClick={() => send('TO_ALARM_PAGE')}>
            {'Alarms'}
          </Menu.Item>
          <Menu.Item key={'1'} onClick={() => send('TO_REALM_PAGE')}>
            {'Realms'}
          </Menu.Item>
          <Menu.Item key={'2'} onClick={() => send('TO_INDEX_SCHEDULER_PAGE')}>
            {'Index Scheduler'}
          </Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '50px 50px', minHeight: '100%' }}>
        {(() => {
          switch (current.value) {
            case 'alarmPage':
              return <AlarmsPage />
            case 'realmPage':
              return <div>hola</div>
            case 'indexSchedulerPage':
              return <IndexSchedulerPage />
            default:
              break;
          }
        })()}
      </Content>
      <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
    </Layout>
  );
}

export default App;
