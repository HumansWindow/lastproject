import React from 'react';
import { useTheme } from 'next-themes';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, ListGroup, Table } from 'react-bootstrap';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const BootstrapDemo = () => {
  const { theme } = useTheme();
  
  return (
    <Container className="my-5">
      <h1>Bootstrap Components with {theme === 'dark' ? 'Dark' : 'Light'} Theme</h1>
      <p className="lead">This page demonstrates Bootstrap components with automatic dark/light theme support.</p>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Featured Card</Card.Header>
            <Card.Body>
              <Card.Title>Special Card Title</Card.Title>
              <Card.Text>
                This card automatically adapts to your current theme preference.
                Try switching between light and dark mode using the button in the navbar.
              </Card.Text>
              <Button variant="primary">Go somewhere</Button>
            </Card.Body>
            <Card.Footer className="text-muted">Last updated 3 mins ago</Card.Footer>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Bootstrap Form</Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control type="email" placeholder="Enter email" />
                  <Form.Text className="text-muted">
                    We'll never share your email with anyone else.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Password" />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check type="checkbox" label="Check me out" />
                </Form.Group>
                
                <Button variant="primary" type="submit">Submit</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={6}>
          <h3>Alerts</h3>
          <Alert variant="primary">This is a primary alert</Alert>
          <Alert variant="secondary">This is a secondary alert</Alert>
          <Alert variant="success">This is a success alert</Alert>
          <Alert variant="danger">This is a danger alert</Alert>
        </Col>
        
        <Col md={6}>
          <h3>Badges</h3>
          <div className="mb-2">
            <Badge bg="primary" className="me-1">Primary</Badge>
            <Badge bg="secondary" className="me-1">Secondary</Badge>
            <Badge bg="success" className="me-1">Success</Badge>
            <Badge bg="danger" className="me-1">Danger</Badge>
            <Badge bg="warning" text="dark" className="me-1">Warning</Badge>
            <Badge bg="info" className="me-1">Info</Badge>
          </div>
          
          <h3 className="mt-4">List Group</h3>
          <ListGroup>
            <ListGroup.Item>Item One</ListGroup.Item>
            <ListGroup.Item>Item Two</ListGroup.Item>
            <ListGroup.Item>Item Three</ListGroup.Item>
            <ListGroup.Item>Item Four</ListGroup.Item>
          </ListGroup>
        </Col>
      </Row>
      
      <h3>Table</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Username</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Jacob</td>
            <td>Thornton</td>
            <td>@fat</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Larry</td>
            <td>Bird</td>
            <td>@twitter</td>
          </tr>
        </tbody>
      </Table>
    </Container>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};

export default BootstrapDemo;