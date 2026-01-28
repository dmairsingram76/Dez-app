import { render } from '@testing-library/react-native';
import FacilityList from '@/components/facility/FacilityList';

const facilities = [
  { id: '1', name: 'Local Gym', distance_km: 1.2 },
];

describe('FacilityList', () => {
  it('renders facilities', () => {
    const { getByText } = render(
      <FacilityList facilities={facilities} />
    );

    expect(getByText('Local Gym')).toBeTruthy();
    expect(getByText('1.2 km away')).toBeTruthy();
  });
});
