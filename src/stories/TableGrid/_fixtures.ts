// Story fixtures of the React TableGrid stories (design/react-src/stories-app/src/stories/TableGrid/fixtures/*), ported 1:1.
// Shared by all TableGrid story files: src/stories/TableGrid/<story-id>.svelte
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---- fixtures/surts.ts
export const FIRST_TABLE: any[] = [{
  hidden: false,
  name: 'partNumber',
  sort: 'default',
  sortable: true,
  title: 'Номер участка',
  width: 152,
  filter: {
    type: 'select',
    options: [{
      key: 'PN-0001',
      value: 'PN-0001'
    }, {
      key: 'PN-0002',
      value: 'PN-0002'
    }, {
      key: 'PN-0003',
      value: 'PN-0003'
    }, {
      key: 'PN-0004',
      value: 'PN-0004'
    }, {
      key: 'PN-0005',
      value: 'PN-0005'
    }]
  }
}, {
  hidden: false,
  name: 'vsnA',
  sort: 'asc',
  sortable: true,
  title: 'Пункт А',
  width: 166,
  filter: {
    type: 'select',
    options: [{
      key: 'A-0001',
      value: 'A-0001'
    }, {
      key: 'A-0002',
      value: 'A-0002'
    }, {
      key: 'A-0003',
      value: 'A-0003'
    }, {
      key: 'A-0004',
      value: 'A-0004'
    }, {
      key: 'A-0005',
      value: 'A-0005'
    }]
  }
}, {
  hidden: false,
  name: 'vsnB',
  sort: 'default',
  sortable: true,
  title: 'Пункт Б',
  width: 126
}, {
  hidden: false,
  name: 'threadCount',
  sort: 'default',
  sortable: true,
  title: 'Всего волокон',
  width: 120.765625
}, {
  hidden: false,
  name: 'length',
  sort: 'default',
  sortable: true,
  title: 'Длина (км)',
  width: 136.875
}, {
  hidden: false,
  name: 'threadCountBusy',
  sort: 'default',
  sortable: true,
  title: 'Занято волокон',
  width: 161.984375
}, {
  hidden: false,
  name: 'cef',
  sort: 'default',
  sortable: true,
  title: 'ОВМ',
  width: 111.015625
}, {
  hidden: false,
  name: 'environmentTypeName',
  sort: 'default',
  sortable: true,
  title: 'Среда',
  width: 100.359375
}, {
  hidden: false,
  name: 'isActualCommunicationLineParts',
  sort: 'default',
  sortable: true,
  title: 'Актуальность участка ЛП',
  width: 220.46875
}, {
  hidden: false,
  name: 'actualThreadCount',
  sort: 'default',
  sortable: true,
  title: 'Актуально волокон',
  width: 178
}, {
  hidden: false,
  name: 'delegationBranch',
  sort: 'default',
  sortable: true,
  title: 'Делегировано',
  width: 100.78125
}, {
  hidden: false,
  name: 'geoNameA',
  sort: 'default',
  sortable: true,
  title: 'Пункт А (География)',
  width: 201.75
}, {
  hidden: false,
  name: 'geoNameB',
  sort: 'default',
  sortable: true,
  title: 'Пункт Б (География)',
  width: 218
}, {
  hidden: false,
  name: 'label',
  sort: 'default',
  sortable: true,
  title: 'Метка',
  width: 86.109375
}, {
  hidden: false,
  name: 'mnoA',
  sort: 'default',
  sortable: true,
  title: 'Пункт А (МНО)',
  width: 146.890625
}, {
  hidden: false,
  name: 'mnoB',
  sort: 'default',
  sortable: true,
  title: 'Пункт Б (МНО)',
  width: 144.328125
}, {
  hidden: false,
  name: 'operatorName',
  sort: 'default',
  sortable: true,
  title: 'Оператор',
  width: 115.4375
}, {
  hidden: false,
  name: 'transitionName',
  sort: 'default',
  sortable: true,
  title: 'МН-переход',
  width: 137.90625
}, {
  hidden: false,
  name: 'isRtkName',
  sort: 'default',
  sortable: true,
  title: 'Принадлежность',
  width: 150.359375
}];
export const SECOND_TABLE: any[] = [{
  hidden: false,
  name: 'number',
  sort: 'asc',
  sortable: true,
  title: 'Номер волокна',
  width: 193
}, {
  hidden: false,
  name: 'isActual',
  sort: 'default',
  sortable: true,
  title: 'Актуально',
  width: 210
}, {
  hidden: false,
  name: 'isRtk',
  sort: 'default',
  sortable: true,
  title: 'Принадлежность РТК',
  width: 210
}, {
  hidden: false,
  name: 'operator',
  sort: 'default',
  sortable: true,
  title: 'Оператор',
  width: 167.484375
}, {
  hidden: false,
  name: 'loading',
  sort: 'default',
  sortable: true,
  title: 'Загрузка',
  width: 148.234375
}, {
  hidden: false,
  name: 'isBooking',
  sort: 'default',
  sortable: true,
  title: 'Бронирование',
  width: 67.28125
}, {
  hidden: false,
  name: 'delegationBranch',
  sort: 'default',
  sortable: true,
  title: 'Делегировано',
  width: 100.78125
}, {
  hidden: false,
  name: 'ownerName',
  sort: 'default',
  sortable: true,
  title: 'Владелец',
  width: 227
}, {
  hidden: false,
  name: 'orderToDelegate',
  sort: 'default',
  sortable: true,
  title: 'Распоряжение на делегирование',
  width: 276.859375
}, {
  hidden: false,
  name: 'idLoFiber',
  sort: 'default',
  sortable: true,
  title: 'ЛС "Волокно"',
  width: 147.5
}, {
  hidden: false,
  name: 'threadStateName',
  sort: 'default',
  sortable: true,
  title: 'Статус',
  width: 400
}, {
  hidden: false,
  name: 'isCanBeUsed',
  sort: 'default',
  sortable: true,
  title: 'Доступно для задействования',
  width: 400
}, {
  hidden: false,
  name: 'label',
  sort: 'default',
  sortable: true,
  title: 'Метка',
  width: 400
}];
export const THIRD_TABLE: any[] = [{
  hidden: false,
  name: 'name',
  sort: 'default',
  sortable: true,
  title: 'Наименование',
  width: 258
}, {
  hidden: false,
  name: 'type',
  sort: 'default',
  sortable: true,
  title: 'Тип',
  width: 432
}, {
  hidden: false,
  name: 'lo',
  sort: 'default',
  sortable: true,
  title: 'ЛС',
  width: 113.671875
}, {
  hidden: false,
  name: 'streamName',
  sort: 'default',
  sortable: true,
  title: 'Уровень',
  width: 130.96875
}, {
  hidden: false,
  name: 'order',
  sort: 'default',
  sortable: true,
  title: 'Распоряжение',
  width: 130.96875
}, {
  hidden: false,
  name: 'terminalNetworkPoint',
  sort: 'default',
  sortable: true,
  title: 'Оконечные ПС',
  width: 130.96875
}];

// ---- fixtures/surts-data.ts
export const SURTS_DATA: any[] = [{
  id: 1001,
  partNumber: 1,
  vsnA: 'A-0001',
  vsnAId: '101',
  vsnB: 'B-0001',
  vsnBId: '201',
  threadCount: 12,
  threadCountBusy: 5,
  environmentTypeId: 1,
  environmentTypeName: 'ENV-1',
  length: 3.25,
  cef: 'CEF-0001',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5001,
  isActualCommunicationLineParts: true,
  actualThreadCount: 12,
  delegationBranch: null,
  locationStartId: 1101,
  locationEndId: 1201,
  geoNameA: 'Город-1, Узел-1',
  geoNameB: 'Город-2, Узел-2',
  label: null,
  mnoA: 'NODE-001',
  mnoB: 'NODE-101',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-1',
  ownerId: 9001,
  transitionName: 'Переход-1',
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 41001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9001,
    ownerName: 'Владелец-1',
    threadLoadingInfo: [{
      name: 'Коннекция-1',
      type: 'Коннекция',
      lo: null,
      streamName: null,
      order: '',
      terminalNetworkPoint: '',
      id: 70001,
      transmissionNumber: '01',
      loPathState: null,
      point1Id: 31001,
      point2Id: 32001
    }, {
      name: 'Линк-1',
      type: 'Линк',
      lo: 'L-1001',
      streamName: 'X',
      order: 'R-0001',
      terminalNetworkPoint: 'A-0001-B-0001',
      id: 70002,
      transmissionNumber: '01',
      loPathState: 'Д',
      point1Id: 31001,
      point2Id: 32001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 41002,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9001,
    ownerName: 'Владелец-1',
    threadLoadingInfo: [{
      name: 'Бронь-1',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 70003,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 41003,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9001,
    ownerName: 'Владелец-1',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1002,
  partNumber: 2,
  vsnA: 'A-0002',
  vsnAId: '102',
  vsnB: 'B-0002',
  vsnBId: '202',
  threadCount: 24,
  threadCountBusy: 12,
  environmentTypeId: 2,
  environmentTypeName: 'ENV-2',
  length: 5.5,
  cef: 'CEF-0002',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5002,
  isActualCommunicationLineParts: true,
  actualThreadCount: 24,
  delegationBranch: 'Филиал-1',
  locationStartId: 1102,
  locationEndId: 1202,
  geoNameA: 'Город-3, Узел-3',
  geoNameB: 'Город-4, Узел-4',
  label: null,
  mnoA: 'NODE-002',
  mnoB: 'NODE-102',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-2',
  ownerId: 9002,
  transitionName: 'Переход-2',
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 42001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9002,
    ownerName: 'Владелец-2',
    threadLoadingInfo: [{
      name: 'Коннекция-2',
      type: 'Коннекция',
      lo: null,
      streamName: null,
      order: '',
      terminalNetworkPoint: '',
      id: 71001,
      transmissionNumber: '02',
      loPathState: null,
      point1Id: 33001,
      point2Id: 34001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 42002,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9002,
    ownerName: 'Владелец-2',
    threadLoadingInfo: [{
      name: 'Бронь-2',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 71002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 42003,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9002,
    ownerName: 'Владелец-2',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1003,
  partNumber: 3,
  vsnA: 'A-0003',
  vsnAId: '103',
  vsnB: 'B-0003',
  vsnBId: '203',
  threadCount: 16,
  threadCountBusy: 6,
  environmentTypeId: 1,
  environmentTypeName: 'ENV-1',
  length: 2.1,
  cef: 'CEF-0003',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5003,
  isActualCommunicationLineParts: false,
  actualThreadCount: 16,
  delegationBranch: null,
  locationStartId: 1103,
  locationEndId: 1203,
  geoNameA: 'Город-5, Узел-5',
  geoNameB: 'Город-6, Узел-6',
  label: null,
  mnoA: 'NODE-003',
  mnoB: 'NODE-103',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-3',
  ownerId: 9003,
  transitionName: null,
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 43001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9003,
    ownerName: 'Владелец-3',
    threadLoadingInfo: [{
      name: 'Линк-3',
      type: 'Линк',
      lo: 'L-3001',
      streamName: 'GE',
      order: 'R-0003',
      terminalNetworkPoint: 'A-0003-B-0003',
      id: 72001,
      transmissionNumber: '03',
      loPathState: 'Д',
      point1Id: 35001,
      point2Id: 36001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 43002,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9003,
    ownerName: 'Владелец-3',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 43003,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9003,
    ownerName: 'Владелец-3',
    threadLoadingInfo: [{
      name: 'Бронь-3',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 72002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1004,
  partNumber: 4,
  vsnA: 'A-0004',
  vsnAId: '104',
  vsnB: 'B-0004',
  vsnBId: '204',
  threadCount: 8,
  threadCountBusy: 2,
  environmentTypeId: 2,
  environmentTypeName: 'ENV-2',
  length: 7.75,
  cef: 'CEF-0004',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5004,
  isActualCommunicationLineParts: true,
  actualThreadCount: 8,
  delegationBranch: null,
  locationStartId: 1104,
  locationEndId: 1204,
  geoNameA: 'Город-7, Узел-7',
  geoNameB: 'Город-8, Узел-8',
  label: null,
  mnoA: 'NODE-004',
  mnoB: 'NODE-104',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-4',
  ownerId: 9004,
  transitionName: null,
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 44001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9004,
    ownerName: 'Владелец-4',
    threadLoadingInfo: [{
      name: 'Линк-4',
      type: 'Линк',
      lo: 'L-4001',
      streamName: '10GE',
      order: 'R-0004',
      terminalNetworkPoint: 'A-0004-B-0004',
      id: 73001,
      transmissionNumber: '04',
      loPathState: 'Д',
      point1Id: 37001,
      point2Id: 38001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 44002,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9004,
    ownerName: 'Владелец-4',
    threadLoadingInfo: [{
      name: 'Бронь-4',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 73002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 44003,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9004,
    ownerName: 'Владелец-4',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1005,
  partNumber: 5,
  vsnA: 'A-0005',
  vsnAId: '105',
  vsnB: 'B-0005',
  vsnBId: '205',
  threadCount: 32,
  threadCountBusy: 20,
  environmentTypeId: 1,
  environmentTypeName: 'ENV-1',
  length: 10.0,
  cef: 'CEF-0005',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5005,
  isActualCommunicationLineParts: true,
  actualThreadCount: 32,
  delegationBranch: 'Филиал-2',
  locationStartId: 1105,
  locationEndId: 1205,
  geoNameA: 'Город-9, Узел-9',
  geoNameB: 'Город-10, Узел-10',
  label: null,
  mnoA: 'NODE-005',
  mnoB: 'NODE-105',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-5',
  ownerId: 9005,
  transitionName: 'Переход-3',
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 45001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9005,
    ownerName: 'Владелец-5',
    threadLoadingInfo: [{
      name: 'Линк-5',
      type: 'Линк',
      lo: 'L-5001',
      streamName: 'WDM',
      order: 'R-0005',
      terminalNetworkPoint: 'A-0005-B-0005',
      id: 74001,
      transmissionNumber: '05',
      loPathState: 'Д',
      point1Id: 39001,
      point2Id: 40001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 45002,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9005,
    ownerName: 'Владелец-5',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 45003,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9005,
    ownerName: 'Владелец-5',
    threadLoadingInfo: [{
      name: 'Бронь-5',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 74002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1006,
  partNumber: 6,
  vsnA: 'A-0006',
  vsnAId: '106',
  vsnB: 'B-0006',
  vsnBId: '206',
  threadCount: 48,
  threadCountBusy: 40,
  environmentTypeId: 2,
  environmentTypeName: 'ENV-2',
  length: 11.5,
  cef: 'CEF-0006',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5006,
  isActualCommunicationLineParts: true,
  actualThreadCount: 48,
  delegationBranch: null,
  locationStartId: 1106,
  locationEndId: 1206,
  geoNameA: 'Город-11, Узел-11',
  geoNameB: 'Город-12, Узел-12',
  label: null,
  mnoA: 'NODE-006',
  mnoB: 'NODE-106',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-6',
  ownerId: 9006,
  transitionName: null,
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 46001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9006,
    ownerName: 'Владелец-6',
    threadLoadingInfo: [{
      name: 'Линк-6',
      type: 'Линк',
      lo: 'L-6001',
      streamName: 'X',
      order: 'R-0006',
      terminalNetworkPoint: 'A-0006-B-0006',
      id: 75001,
      transmissionNumber: '06',
      loPathState: 'Д',
      point1Id: 41001,
      point2Id: 42001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 46002,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9006,
    ownerName: 'Владелец-6',
    threadLoadingInfo: [{
      name: 'Бронь-6',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 75002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 46003,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9006,
    ownerName: 'Владелец-6',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1007,
  partNumber: 7,
  vsnA: 'A-0007',
  vsnAId: '107',
  vsnB: 'B-0007',
  vsnBId: '207',
  threadCount: 20,
  threadCountBusy: 10,
  environmentTypeId: 1,
  environmentTypeName: 'ENV-1',
  length: 4.0,
  cef: 'CEF-0007',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5007,
  isActualCommunicationLineParts: true,
  actualThreadCount: 20,
  delegationBranch: null,
  locationStartId: 1107,
  locationEndId: 1207,
  geoNameA: 'Город-13, Узел-13',
  geoNameB: 'Город-14, Узел-14',
  label: null,
  mnoA: 'NODE-007',
  mnoB: 'NODE-107',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-7',
  ownerId: 9007,
  transitionName: null,
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 47001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9007,
    ownerName: 'Владелец-7',
    threadLoadingInfo: [{
      name: 'Линк-7',
      type: 'Линк',
      lo: 'L-7001',
      streamName: 'GE',
      order: 'R-0007',
      terminalNetworkPoint: 'A-0007-B-0007',
      id: 76001,
      transmissionNumber: '07',
      loPathState: 'Д',
      point1Id: 43001,
      point2Id: 44001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 47002,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9007,
    ownerName: 'Владелец-7',
    threadLoadingInfo: [{
      name: 'Бронь-7',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 76002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 47003,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9007,
    ownerName: 'Владелец-7',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}, {
  id: 1008,
  partNumber: 8,
  vsnA: 'A-0008',
  vsnAId: '108',
  vsnB: 'B-0008',
  vsnBId: '208',
  threadCount: 28,
  threadCountBusy: 18,
  environmentTypeId: 2,
  environmentTypeName: 'ENV-2',
  length: 6.2,
  cef: 'CEF-0008',
  cefInfo: 'Описание проекта (обезличено)\r\nСхема связи (обезличено)\r\nСтатус: реализован\r\n',
  cefId: 5008,
  isActualCommunicationLineParts: false,
  actualThreadCount: 28,
  delegationBranch: 'Филиал-3',
  locationStartId: 1108,
  locationEndId: 1208,
  geoNameA: 'Город-15, Узел-15',
  geoNameB: 'Город-16, Узел-16',
  label: null,
  mnoA: 'NODE-008',
  mnoB: 'NODE-108',
  operatorId: null,
  operatorName: null,
  ownerName: 'Владелец-8',
  ownerId: 9008,
  transitionName: 'Переход-4',
  isRtkName: 'Компания',
  isRtk: true,
  threads: [{
    delegationBranch: null,
    id: 48001,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: 'Д',
    number: 1,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9008,
    ownerName: 'Владелец-8',
    threadLoadingInfo: [{
      name: 'Линк-8',
      type: 'Линк',
      lo: 'L-8001',
      streamName: 'GE',
      order: 'R-0008',
      terminalNetworkPoint: 'A-0008-B-0008',
      id: 77001,
      transmissionNumber: '08',
      loPathState: 'Д',
      point1Id: 45001,
      point2Id: 46001
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 48002,
    idLoFiber: null,
    isActual: true,
    isBooking: true,
    isRtk: true,
    loading: 'Бр',
    number: 2,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9008,
    ownerName: 'Владелец-8',
    threadLoadingInfo: [{
      name: 'Бронь-8',
      type: 'Бронь',
      lo: null,
      streamName: null,
      order: null,
      terminalNetworkPoint: null,
      id: 77002,
      transmissionNumber: null,
      loPathState: null,
      point1Id: 0,
      point2Id: 0
    }],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }, {
    delegationBranch: null,
    id: 48003,
    idLoFiber: null,
    isActual: true,
    isBooking: false,
    isRtk: true,
    loading: '',
    number: 3,
    operator: null,
    operatorId: null,
    orderToDelegate: null,
    orderToDelegateState: null,
    ownerId: 9008,
    ownerName: 'Владелец-8',
    threadLoadingInfo: [],
    threadStateId: 1,
    threadStateName: 'Действующее',
    isCanBeUsed: true,
    label: null
  }]
}];

// ---- fixtures/columns.ts
export const DEFAULT_COLUMNS: any[] = [{
  name: 'rasp',
  title: 'Распоряжение',
  sortable: true,
  unit: 'km',
  size: {
    width: '300px'
  }
}, {
  name: 'vls',
  title: 'ВЛС',
  unit: 'km',
  size: {
    width: '200px'
  }
}, {
  name: 'ur',
  title: 'УР',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  }
}, {
  name: 'ps',
  title: 'Оконечные ПС Оконечные ПС Оконечные ПС',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  }
}, {
  name: 'tech',
  title: 'Тех примечание',
  size: {
    width: '200px'
  }
}, {
  name: 'view',
  title: 'Вид работ',
  unit: '$',
  size: {
    width: '200px'
  }
}, {
  name: 'viis',
  title: 'ВИ/ИС',
  size: {
    width: '200px'
  }
}, {
  name: 'sro',
  title: 'СроОтклПлан',
  size: {
    width: '200px'
  }
}, {
  name: 'status',
  title: 'Статус',
  size: {
    width: '200px'
  }
}];
export const DEFAULT_COLUMNS_WITH_POPOVER_FILTERS: any[] = [{
  name: 'rasp',
  title: 'Распоряжение',
  sortable: true,
  unit: 'km',
  size: {
    width: '300px'
  },
  sorting: {
    sort: 'asc'
  },
  filter: {
    type: 'select',
    options: [{
      key: '22-2-50-6897-1',
      value: '22-2-50-6897-1'
    }, {
      key: '20-2-50-6897-1',
      value: '20-2-50-6897-1'
    }, {
      key: '12-2-50-6897-1',
      value: '12-2-50-6897-1'
    }, {
      key: '13-2-50-6897-1',
      value: '13-2-50-6897-1'
    }, {
      key: '10-2-50-6897-1',
      value: '10-2-50-6897-1'
    }]
  }
}, {
  name: 'vls',
  title: 'ВЛС',
  unit: 'km',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'asc'
  },
  filter: {
    type: 'select',
    options: [{
      key: '22-2-50-6897-1',
      value: '22-2-50-6897-1'
    }, {
      key: '20-2-50-6897-1',
      value: '20-2-50-6897-1'
    }, {
      key: '12-2-50-6897-1',
      value: '12-2-50-6897-1'
    }, {
      key: '13-2-50-6897-1',
      value: '13-2-50-6897-1'
    }, {
      key: '10-2-50-6897-1',
      value: '10-2-50-6897-1'
    }]
  }
}, {
  name: 'ur',
  title: 'УР',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  },
  filter: {
    type: 'operators'
  }
}, {
  name: 'ps',
  title: 'Оконечные ПС Оконечные ПС Оконечные ПС',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  }
}, {
  name: 'tech',
  title: 'Тех примечание',
  size: {
    width: '200px'
  }
}, {
  name: 'view',
  title: 'Вид работ',
  unit: '$',
  size: {
    width: '200px'
  }
}, {
  name: 'viis',
  title: 'ВИ/ИС',
  size: {
    width: '200px'
  }
}, {
  name: 'sro',
  title: 'СроОтклПлан',
  size: {
    width: '200px'
  }
}, {
  name: 'status',
  title: 'Статус',
  size: {
    width: '200px'
  }
}];
export const DEFAULT_COLUMNS_WITH_INLINE_FILTERS: any[] = [{
  name: 'rasp',
  title: 'Распоряжение',
  sortable: true,
  unit: 'km',
  size: {
    width: '300px'
  },
  sorting: {
    sort: 'asc'
  },
  filter: {
    type: 'select',
    position: 'inline',
    options: [{
      key: '22-2-50-6897-1',
      value: '22-2-50-6897-1'
    }, {
      key: '20-2-50-6897-1',
      value: '20-2-50-6897-1'
    }, {
      key: '12-2-50-6897-1',
      value: '12-2-50-6897-1'
    }, {
      key: '13-2-50-6897-1',
      value: '13-2-50-6897-1'
    }, {
      key: '10-2-50-6897-1',
      value: '10-2-50-6897-1'
    }]
  }
}, {
  name: 'vls',
  title: 'ВЛС',
  unit: 'km',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'asc'
  },
  filter: {
    type: 'select',
    position: 'inline',
    options: [{
      key: '22-2-50-6897-1',
      value: '22-2-50-6897-1'
    }, {
      key: '20-2-50-6897-1',
      value: '20-2-50-6897-1'
    }, {
      key: '12-2-50-6897-1',
      value: '12-2-50-6897-1'
    }, {
      key: '13-2-50-6897-1',
      value: '13-2-50-6897-1'
    }, {
      key: '10-2-50-6897-1',
      value: '10-2-50-6897-1'
    }]
  }
}, {
  name: 'ur',
  title: 'УР',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  },
  filter: {
    type: 'operators',
    position: 'inline'
  }
}, {
  name: 'ps',
  title: 'Оконечные ПС Оконечные ПС Оконечные ПС',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  }
}, {
  name: 'tech',
  title: 'Тех примечание',
  size: {
    width: '200px'
  }
}, {
  name: 'view',
  title: 'Вид работ',
  unit: '$',
  size: {
    width: '200px'
  }
}, {
  name: 'viis',
  title: 'ВИ/ИС',
  size: {
    width: '200px'
  }
}, {
  name: 'sro',
  title: 'СроОтклПлан',
  size: {
    width: '200px'
  }
}, {
  name: 'status',
  title: 'Статус',
  size: {
    width: '200px'
  }
}];
export const DEFAULT_COLUMNS_WITH_SORTING: any[] = [{
  name: 'rasp',
  title: 'Распоряжение',
  sortable: true,
  unit: 'km',
  size: {
    width: '300px'
  },
  sorting: {
    sort: 'asc'
  }
}, {
  name: 'vls',
  title: 'ВЛС',
  unit: 'km',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'desc'
  }
}, {
  name: 'ur',
  title: 'УР',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}, {
  name: 'ps',
  title: 'Оконечные ПС Оконечные ПС Оконечные ПС',
  sortable: true,
  sort: 'asc',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}, {
  name: 'tech',
  title: 'Тех примечание',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}, {
  name: 'view',
  title: 'Вид работ',
  unit: '$',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}, {
  name: 'viis',
  title: 'ВИ/ИС',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}, {
  name: 'sro',
  title: 'СроОтклПлан',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}, {
  name: 'status',
  title: 'Статус',
  size: {
    width: '200px'
  },
  sorting: {
    sort: 'default'
  }
}];

// ---- fixtures/rows.ts
export const makeDataRow = (count = 50, parent = ''): any[] =>
	new Array(count).fill(0).map((_, index) => ({
		id: parent + index.toString(),
		rasp: '20-2-50-6897-1',
		vls: { content: 'Активированное', tooltip: { header: 'Заголовок 2', text: 'Основной текст' } },
		ur: 'Организация Организация',
		ps: 'KS',
		tech: '10GE',
		view: '2474',
		viis: '–',
		sro: 'Организация',
		status: { content: 'СПТ МОПРСТ', tooltip: { header: 'Заголовок', text: 'Основной текст' } },
		children: [] as any[]
	}));

export const ROWS: any[] = makeDataRow(20);
ROWS[1].children = makeDataRow(5, 'a');
ROWS[1].children[1].children = makeDataRow(3, 'a1');
ROWS[4].children = makeDataRow(3, 'b');
ROWS[6].children = makeDataRow(7, 'c');

export const defaultRows: any[] = [
	{ id: '1', rasp: '22-2-50-6897-1', vls: 'Активированное', ur: 'Организация' },
	{ id: '2', rasp: '20-2-50-6897-1', vls: 'Активированное', ur: 'Организация' },
	{ id: '3', rasp: '12-2-50-6897-1', vls: 'Активированное', ur: 'Физическое лицо' },
	{ id: '4', rasp: '13-2-50-6897-1', vls: 'Активированное', ur: 'Физическое лицо' },
	{ id: '5', rasp: '10-2-50-6897-1', vls: 'Активированное', ur: 'Организация' }
];

export const makeDataRow2 = (count = 50): any[] =>
	new Array(count).fill(0).map((_, index) => ({
		id: index.toString(),
		rasp: '20-2-50-6897-1',
		vls: { content: 'Активированное', tooltip: { header: 'Заголовок 2', text: 'Основной текст' } },
		ur: 'Организация Организация',
		ps: 'KS',
		tech: '10GE',
		view: '2474',
		viis: '–',
		sro: 'Организация',
		status: { content: 'СПТ МОПРСТ', tooltip: { header: 'Заголовок', text: 'Основной текст' } }
	}));

export const PAGINATION_ROWS: any[] = new Array(200).fill(0).map((_, index) => ({
	id: index,
	rasp: index + '-2-50-6897-1',
	vls: 'Активированное',
	ur: 'Организация',
	obm: 'OBM центр Архангельск Юг',
	cdn: 'CDN Ульяновск Волга'
}));

/**
 * The harness seeds `Math.random` identically on both sides. Storybook / the React decorators consume 3 values of that sequence before a
 * story renders, so a story that draws random rows (`SURTS_DATA[Math.floor(Math.random() * n)]`) has to skip them to get the same rows.
 */
export const skipReactRandom = (count = 3) => {
  for (let i = 0; i < count; i++) Math.random();
};
