export const AIRLINES = [
  { id: '1', name: '대한항공' },
  { id: '2', name: '아시아나항공' },
  { id: '3', name: '제주항공' },
  { id: '4', name: '티웨이항공' },
  { id: '5', name: '진에어' },
  { id: '6', name: '에어부산' },
  { id: '7', name: '에어서울' },
  { id: '8', name: '이스타항공' },
  { id: '9', name: '에어프레미아' },
  { id: '10', name: '플라이강원' },
];

export interface Airline {
  id: string;
  name: string;
  logo?: string;  // 나중에 로고 이미지 추가 가능
} 