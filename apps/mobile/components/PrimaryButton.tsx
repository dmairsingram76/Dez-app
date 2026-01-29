import { TouchableOpacity, Text } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

type Variant = 'primary' | 'secondary';

type Props = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: Props) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      className={[
        'w-full py-3 rounded-xl mb-3 items-center',
        isPrimary ? 'bg-black' : 'border border-black bg-white',
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Text
        className={[
          'text-base font-semibold',
          isPrimary ? 'text-white' : 'text-black',
        ].join(' ')}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

