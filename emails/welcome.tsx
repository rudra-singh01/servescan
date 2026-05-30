import { Html, Body, Head, Heading, Text, Container } from '@react-email/components';

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>Welcome to ScanServe!</Heading>
          <Text>Namaste {name},</Text>
          <Text>
            Aapka account ready hai. Ab apna digital menu banayein aur QR code download karein.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
