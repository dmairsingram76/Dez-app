import { render, fireEvent } from '@testing-library/react-native';
import Chat from '@/components/chat/Chat';

describe('Chat Component', () => {
  it('renders Dez greeting', () => {
    const { getByText } = render(<Chat />);
    expect(getByText(/hi, i’m dez/i)).toBeTruthy();
  });

  it('sends user message', () => {
    const { getByPlaceholderText, getByText } = render(<Chat />);

    fireEvent.changeText(
      getByPlaceholderText('Type your answer…'),
      'I want to get fitter'
    );
    fireEvent.press(getByText('Send'));

    expect(getByText('I want to get fitter')).toBeTruthy();
  });
});
