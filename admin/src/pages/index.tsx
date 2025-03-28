import React from 'react';
import { Box, Flex, Grid, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { AdminLayout } from '../components/layouts/AdminLayout';
import { UserChart } from '../components/charts/UserChart';
import { NFTChart } from '../components/charts/NFTChart';
import { TransactionsTable } from '../components/tables/TransactionsTable';

export default function Dashboard() {
  return (
    <AdminLayout title="Dashboard">
      <Box p={4}>
        <Grid templateColumns="repeat(12, 1fr)" gap={6}>
          <Box gridColumn="span 12">
            <Heading size="lg" mb={4}>Dashboard Overview</Heading>
          </Box>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} gridColumn="span 12">
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>Total Users</StatLabel>
              <StatNumber>4,250</StatNumber>
              <StatHelpText>+12% from last month</StatHelpText>
            </Stat>
            
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>NFTs Minted</StatLabel>
              <StatNumber>872</StatNumber>
              <StatHelpText>+23% from last month</StatHelpText>
            </Stat>
            
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>Active Wallets</StatLabel>
              <StatNumber>2,430</StatLabel>
              <StatHelpText>+5% from last month</StatHelpText>
            </Stat>
            
            <Stat p={4} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
              <StatLabel>Token Volume (24h)</StatLabel>
              <StatNumber>$245,340</StatNumber>
              <StatHelpText>+18% from yesterday</StatHelpText>
            </Stat>
          </SimpleGrid>
          
          <Box gridColumn={{ base: "span 12", lg: "span 8" }} mt={6}>
            <UserChart />
          </Box>
          
          <Box gridColumn={{ base: "span 12", lg: "span 4" }} mt={6}>
            <NFTChart />
          </Box>
          
          <Box gridColumn="span 12" mt={6}>
            <TransactionsTable />
          </Box>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
