import Button from './Button';

export default function PrimaryButton({ loadingText = 'جارٍ المعالجة…', ...props }) {
  return <Button variant="primary" loadingText={loadingText} {...props} />;
}
