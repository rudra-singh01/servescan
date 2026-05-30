import { Html, Body, Head, Heading, Text, Container } from '@react-email/components';

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>Welcome to ScanServe!</Heading>
          <Text>Hello {name},</Text>
          <Text>
            Your account is ready. Create your digital menu and download your QR code.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
