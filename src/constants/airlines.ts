export interface Airline {
  id: string;
  name: string;
  logo?: string;  // 나중에 로고 이미지 추가 가능
}

export const AIRLINES: Airline[] = [
  { id: 'korean', name: '대한항공' },
  { id: 'asiana', name: '아시아나항공' },
  { id: 'jinair', name: '진에어' },
  { id: 'airbusan', name: '에어부산' },
  { id: 'airseoul', name: '에어서울' },
  { id: 'jeju', name: '제주항공' },
  { id: 'tway', name: '티웨이항공' },
  { id: 'eastar', name: '이스타항공' },
  { id: 'airpremia', name: '에어프레미아' },
  { id: 'flygang', name: '플라이강원' },
]; 