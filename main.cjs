import('./check.js')
  .then((module) => {
    // ���������, ���� �����, ���-�� ����
    console.log('ES-������ check.js ������� �������� ����� ������.');
  })
  .catch((err) => {
    console.error('������ ��� �������� ES-������:', err);
  });