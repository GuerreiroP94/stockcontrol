import React, { useEffect, useState } from 'react';
import { Package, AlertCircle, TrendingUp, Users, ArrowUp, ArrowDown } from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import AlertsList from '../../components/dashboard/AlertsList';
import RecentMovements from '../../components/dashboard/RecentMovements';
import componentsService from '../../services/components.service';
import productsService from '../../services/products.service';
import movementsService from '../../services/movements.service';
import alertsService from '../../services/alerts.service';
import { StockAlert, StockMovement, Component, Product } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalComponents: number;
  totalProducts: number;
  lowStockItems: number;
  todayMovements: number;
}

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalComponents: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todayMovements: 0,
  });
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [componentsData, productsData, alertsData, movementsData] = await Promise.all([
        componentsService.getAll(),
        productsService.getAll(),
        alertsService.getAll({ page: 1, pageSize: 10 }),
        movementsService.getAll({ page: 1, pageSize: 10 })
      ]);

      // Calculate stats
      const lowStock = componentsData.filter((c: Component) => 
        c.quantityInStock <= c.minimumQuantity
      ).length;

      const today = new Date().toDateString();
      const todayMovs = movementsData.filter((m: StockMovement) => 
        new Date(m.movementDate).toDateString() === today
      ).length;

      setStats({
        totalComponents: componentsData.length,
        totalProducts: productsData.length,
        lowStockItems: lowStock,
        todayMovements: todayMovs,
      });

      setAlerts(alertsData);
      setMovements(movementsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo de volta, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total de Componentes"
          value={stats.totalComponents}
          icon={Package}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        
        <StatsCard
          title="Total de Produtos"
          value={stats.totalProducts}
          icon={Package}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        
        <StatsCard
          title="Estoque Baixo"
          value={stats.lowStockItems}
          subtitle="Itens abaixo do mínimo"
          icon={AlertCircle}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        
        <StatsCard
          title="Movimentações Hoje"
          value={stats.todayMovements}
          icon={TrendingUp}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Alerts and Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsList alerts={alerts} loading={loading} />
        <RecentMovements movements={movements} loading={loading} />
      </div>
    </div>
  );
};

export default DashboardPage;