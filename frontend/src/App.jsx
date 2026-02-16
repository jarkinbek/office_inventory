import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Layout, Menu, Button, Table, Tag, Input, Select, Modal, Form,
  message, Row, Col, Typography, Space, Popconfirm, List, Empty, Card, Statistic, Descriptions, Tooltip, Tabs, Upload, Drawer
} from 'antd';
import {
  AppstoreOutlined, UserOutlined,
  LogoutOutlined, PlusOutlined, SearchOutlined,
  DeleteOutlined, EditOutlined, BankOutlined, EyeOutlined,
  LockOutlined, ArrowLeftOutlined, LaptopOutlined, SettingTwoTone, PoweroffOutlined,
  TeamOutlined, BookOutlined, DownloadOutlined, UploadOutlined, MenuOutlined, PrinterOutlined
} from '@ant-design/icons';

import { LanguageSwitcher } from './components/LanguageSwitcher';
import { translations } from './utils/translations';
import './responsive.css';

const { Header, Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

// АВТОМАТИЧЕСКИЙ АДРЕС СЕРВЕРА
const API_URL = '/api';

function App() {
  const [lang, setLang] = useState('ru');
  const t = (key) => translations[lang][key] || key;

  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('site_auth') === 'true'
  );

  const [loginForm] = Form.useForm();
  const [appMode, setAppMode] = useState('public');

  // ✅ ВАЖНО: активная страница меню отдельно от пагинации таблицы
  const [activePage, setActivePage] = useState('dashboard');

  // --- DATA STATE ---
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auth & Filters
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // ФИЛЬТРЫ
  const [searchText, setSearchText] = useState('');
  const [filterRoom, setFilterRoom] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);

  // MOBILE STATE
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // ✅ ПАГИНАЦИЯ ТАБЛИЦЫ (отдельно!)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isUserAssetsModalOpen, setIsUserAssetsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // States for Editing
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewDevice, setViewDevice] = useState(null);

  const [productForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [employeeForm] = Form.useForm();

  // --- ЛОГИКА АВТОРИЗАЦИИ ---
  const handleGlobalLogin = (values) => {
    if (
      (values.username === 'admin' && values.password === 'admin') ||
      (values.username === 'user' && values.password === 'user')
    ) {
      localStorage.setItem('site_auth', 'true');
      setIsAuthenticated(true);
      message.success(t('welcome_user'));
      fetchData();
    } else {
      message.error(t('wrong_pass'));
    }
  };

  const handleGlobalLogout = () => {
    localStorage.removeItem('site_auth');
    setIsAuthenticated(false);
    setAppMode('public');
    setActivePage('dashboard');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setAppMode('admin');
      setIsAdminLoginModalOpen(false);
      setAdminPassword('');
      message.success(t('welcome_admin'));
      setActivePage('dashboard');
    } else {
      message.error(t('wrong_pass'));
    }
  };

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/report`);

      const roomsData = res.data.rooms || [];
      const employeesData = res.data.employees || [];
      const categoriesData = res.data.categories || [];

      setRooms(roomsData);
      setEmployees(employeesData);
      setCategories(categoriesData);

      const devices = [];
      if (Array.isArray(roomsData)) {
        roomsData.forEach((room) => {
          const roomDevices = room.devices || [];
          roomDevices.forEach((dev) => {
            devices.push({
              ...dev,
              key: dev.id,
              room_id: room.id,
              room_name: room.room_name,
              floor: room.floor,
            });
          });
        });
      }
      setAllDevices(devices);

      // QR param
      const params = new URLSearchParams(window.location.search);
      const qrId = params.get('qr_id');
      if (qrId) {
        const targetDevice = devices.find((d) => d.id === parseInt(qrId));
        if (targetDevice) {
          setViewDevice(targetDevice);
          setIsViewModalOpen(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (e) {
      console.error("Ошибка соединения:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Сброс страницы при фильтрации (это правильно)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterRoom, filterCategory, filterStatus]);

  // --- ACTIONS (EXPORT / IMPORT / QR) ---
  const handleExport = () => {
    window.open(`${API_URL}/export_excel?lang=${lang}`, '_blank');
  };

  const handleImport = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_URL}/import_excel`, formData);
      message.success('Импорт успешно завершен!');
      onSuccess("Ok");
      setIsImportModalOpen(false);
      fetchData();
    } catch (err) {
      message.error('Ошибка импорта');
      onError({ err });
    }
  };

  const handlePrintQR = async () => {
    if (selectedDevices.length === 0) {
      message.warning("Выберите устройства для печати");
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/export_qr_pdf`,
        { device_ids: selectedDevices },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qr_labels_${selectedDevices.length}.pdf`);
      document.body.appendChild(link);
      link.click();
      setSelectedDevices([]);
      message.success("PDF скачан");
    } catch (e) {
      message.error("Ошибка печати QR");
    }
  };

  const downloadQRCode = () => {
    const qrCanvas = document.getElementById("qr-gen");
    if (!qrCanvas) return;
    const padding = 20;
    const textHeight = 40;
    const width = qrCanvas.width + padding * 2;
    const height = qrCanvas.height + padding * 2 + textHeight;
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = width;
    combinedCanvas.height = height;
    const ctx = combinedCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(qrCanvas, padding, padding);
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(viewDevice?.inventory_number || '', width / 2, height - padding);
    const pngUrl = combinedCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qr_${viewDevice?.inventory_number}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // --- CRUD OPERATIONS ---
  const handleSaveRoom = async (values) => {
    try {
      if (editingRoom) {
        await axios.put(`${API_URL}/rooms/${editingRoom.id}`, values);
        message.success('Комната обновлена');
      } else {
        await axios.post(`${API_URL}/rooms/`, values);
        message.success(t('msg_success_add'));
      }
      setIsRoomModalOpen(false);
      roomForm.resetFields();
      setEditingRoom(null);
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      await axios.delete(`${API_URL}/rooms/${id}`);
      message.success(t('msg_success_del'));
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleSaveCategory = async (values) => {
    try {
      if (editingCategory) {
        await axios.put(`${API_URL}/categories/${editingCategory.id}`, values);
        message.success('Категория обновлена');
      } else {
        await axios.post(`${API_URL}/categories/`, values);
        message.success(t('msg_success_add'));
      }
      setIsCategoryModalOpen(false);
      categoryForm.resetFields();
      setEditingCategory(null);
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      message.success(t('msg_success_del'));
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleSaveProduct = async (values) => {
    if (values.inventory_number) {
      const isDuplicate = (allDevices || []).some(
        (d) =>
          d.inventory_number === values.inventory_number &&
          (!editingDevice || d.id !== editingDevice.id)
      );
      if (isDuplicate) {
        message.error(t('msg_duplicate_id'));
        return;
      }
    }
    try {
      if (editingDevice) {
        await axios.put(`${API_URL}/devices/${editingDevice.id}`, values);
        message.success(t('msg_success_add'));
      } else {
        await axios.post(`${API_URL}/devices/`, values);
        message.success(t('msg_success_add'));
      }
      setIsProductModalOpen(false);
      productForm.resetFields();
      setEditingDevice(null);
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      await axios.delete(`${API_URL}/devices/${id}`);
      message.success(t('msg_success_del'));
      setIsProductModalOpen(false);
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleSaveEmployee = async (values) => {
    try {
      if (editingEmployee) {
        await axios.put(`${API_URL}/employees/${editingEmployee.id}`, values);
        message.success('Сотрудник обновлен!');
      } else {
        await axios.post(`${API_URL}/employees/`, values);
        message.success(t('msg_success_add'));
      }
      setIsEmployeeModalOpen(false);
      employeeForm.resetFields();
      setEditingEmployee(null);
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await axios.delete(`${API_URL}/employees/${id}`);
      message.success(t('msg_success_del'));
      fetchData();
    } catch (e) {
      message.error(t('msg_error'));
    }
  };

  // --- FILTER LOGIC ---
  const filteredDevices = (allDevices || []).filter((d) => {
    const text = searchText.toLowerCase();
    const matchesSearch =
      String(d.id).includes(text) ||
      (d.name || "").toLowerCase().includes(text) ||
      (d.price && String(d.price).toLowerCase().includes(text)) ||
      (d.inventory_number && String(d.inventory_number).toLowerCase().includes(text)) ||
      (d.owner_name && String(d.owner_name).toLowerCase().includes(text));

    const matchesRoom = filterRoom ? d.room_id === filterRoom : true;
    const matchesCategory = filterCategory ? d.type === filterCategory : true;
    const matchesStatus = filterStatus ? d.status === filterStatus : true;

    return matchesSearch && matchesRoom && matchesCategory && matchesStatus;
  });

  const filteredEmployees = (employees || []).filter((e) =>
    (e.full_name || "").toLowerCase().includes(searchText.toLowerCase())
  );

  const resetFilters = () => {
    setSearchText('');
    setFilterRoom(null);
    setFilterCategory(null);
    setFilterStatus(null);
    setCurrentPage(1);
  };

  // ✅ FIX: безопасные значения пагинации + slice (иначе antd может давать NaN range)
  const totalFiltered = filteredDevices.length;
  const safeCurrent = Number.isFinite(+currentPage) && +currentPage >= 1 ? +currentPage : 1;
  const safePageSize = Number.isFinite(+pageSize) && +pageSize >= 1 ? +pageSize : 10;

  const startIndex = (safeCurrent - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  const pagedDevices = filteredDevices.slice(startIndex, endIndex);

  // --- HELPERS ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'green';
      case 'in_stock': return 'blue';
      case 'repair': return 'orange';
      case 'broken': return 'red';
      case 'decommissioned': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'working': return lang === 'uz' ? 'Ishlayapti' : 'В работе';
      case 'in_stock': return lang === 'uz' ? 'Omborda' : 'На складе';
      case 'repair': return lang === 'uz' ? "Ta'mirda" : 'В ремонте';
      case 'broken': return lang === 'uz' ? 'Buzilgan' : 'Сломано';
      case 'decommissioned': return lang === 'uz' ? 'Hisobdan chiqarilgan' : 'Списано';
      default: return status;
    }
  };

  const openCreateProductModal = () => { setEditingDevice(null); productForm.resetFields(); setIsProductModalOpen(true); };
  const openEditProductModal = (record) => { setEditingDevice(record); productForm.setFieldsValue(record); setIsProductModalOpen(true); };
  const openCreateEmployeeModal = () => { setEditingEmployee(null); employeeForm.resetFields(); setIsEmployeeModalOpen(true); };
  const openEditEmployeeModal = (record) => { setEditingEmployee(record); employeeForm.setFieldsValue(record); setIsEmployeeModalOpen(true); };
  const openCreateRoomModal = () => { setEditingRoom(null); roomForm.resetFields(); setIsRoomModalOpen(true); };
  const openEditRoomModal = (record) => { setEditingRoom(record); roomForm.setFieldsValue({ name: record.room_name }); setIsRoomModalOpen(true); };
  const openCreateCategoryModal = () => { setEditingCategory(null); categoryForm.resetFields(); setIsCategoryModalOpen(true); };
  const openEditCategoryModal = (record) => { setEditingCategory(record); categoryForm.setFieldsValue({ name: record.name }); setIsCategoryModalOpen(true); };
  const openUserAssets = (user) => { setSelectedUser(user); setIsUserAssetsModalOpen(true); };
  const openViewModal = (record) => { setViewDevice(record); setIsViewModalOpen(true); };

  // --- COLUMNS ---
  const publicColumns = [
    { title: '№', key: 'index', width: 50, render: (text, record, index) => <b>{index + 1}</b> },
    { title: t('col_inv'), dataIndex: 'inventory_number', render: (tt, r) => tt ? <a onClick={() => openViewModal(r)} style={{ fontWeight: 'bold' }}>{tt}</a> : '-' },
    { title: t('col_user'), dataIndex: 'owner_name', render: tt => tt ? <Tag color="purple">{tt}</Tag> : <span style={{ color: '#ccc' }}>-</span> },
    { title: t('col_product'), dataIndex: 'name', render: tt => <b>{tt}</b> },
    { title: t('label_cat'), dataIndex: 'type', render: tt => <Tag color="cyan">{tt}</Tag> },
    { title: 'Прайс', dataIndex: 'price', render: tt => <Tag color="gold">{tt || '0'}</Tag> },
    { title: t('col_location'), dataIndex: 'room_name', render: tt => <Tag color="blue">{tt}</Tag> },
    { title: t('col_details'), dataIndex: 'details', render: tt => tt ? <span style={{ color: '#666' }}>{tt.length > 15 ? tt.substring(0, 15) + '...' : tt}</span> : '-' },
    { title: t('col_status'), dataIndex: 'status', render: s => <Tag color={getStatusColor(s)}>{getStatusLabel(s)}</Tag> },
  ];

  const adminColumns = [
    ...publicColumns,
    { title: t('col_action'), key: 'action', render: (_, r) => <Button icon={<EditOutlined />} onClick={() => openEditProductModal(r)} size="small" /> }
  ];

  const empColumns = [
    { title: t('col_full_name'), dataIndex: 'full_name', render: tt => <b>{tt}</b> },
    { title: t('col_position'), dataIndex: 'position', render: tt => <Tag>{tt}</Tag> },
    { title: t('col_assets'), key: 'assets', align: 'center', render: (_, rec) => <Button type="dashed" shape="circle" icon={<EyeOutlined />} onClick={() => openUserAssets(rec)} /> },
    {
      title: t('col_action'),
      key: 'action',
      render: (_, rec) => (
        <Space>
          <Button type="default" icon={<EditOutlined />} onClick={() => openEditEmployeeModal(rec)} />
          <Popconfirm title={t('delete_confirm')} onConfirm={() => handleDeleteEmployee(rec.id)}>
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const roomColumns = [
    { title: 'Название', dataIndex: 'room_name', render: tt => <b>{tt}</b> },
    {
      title: 'Действие',
      key: 'action',
      render: (_, rec) => (
        <Space>
          <Button type="default" icon={<EditOutlined />} onClick={() => openEditRoomModal(rec)} />
          <Popconfirm title="Удалить комнату?" onConfirm={() => handleDeleteRoom(rec.id)}>
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const categoryColumns = [
    { title: 'Название', dataIndex: 'name', render: tt => <b>{tt}</b> },
    {
      title: 'Действие',
      key: 'action',
      render: (_, rec) => (
        <Space>
          <Button type="default" icon={<EditOutlined />} onClick={() => openEditCategoryModal(rec)} />
          <Popconfirm title="Удалить категорию?" onConfirm={() => handleDeleteCategory(rec.id)}>
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  const menuItems = [
    { key: 'dashboard', icon: <AppstoreOutlined />, label: t('dashboard') },
    { key: 'references', icon: <BookOutlined />, label: 'Справочники' },
    { key: 'logout', icon: <LogoutOutlined />, label: t('logout'), danger: true, style: { marginTop: '50px' } },
  ];

  // ====================== LOGIN SCREEN ======================
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(31, 47, 97, 0.15)', borderRadius: 20, border: 'none' }}>
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <div style={{ width: 70, height: 70, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto', fontSize: 32, marginBottom: 16 }}><LaptopOutlined /></div>
            <Typography.Title level={2} style={{ marginBottom: 8, color: '#1f2f61', fontWeight: 700 }}>InnoTechnopark</Typography.Title>
            <Typography.Text style={{ color: '#6b7280', fontSize: 14 }}>{t('site_access')}</Typography.Text>
          </div>

          <Form form={loginForm} layout="vertical" onFinish={handleGlobalLogin}>
            <Form.Item name="username" rules={[{ required: true, message: t('username') + ' required' }]}>
              <Input prefix={<UserOutlined />} placeholder={t('username')} size="large" style={{ borderRadius: 10, borderColor: '#e5e7eb' }} />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: t('password') + ' required' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder={t('password')} size="large" style={{ borderRadius: 10, borderColor: '#e5e7eb' }} />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 10, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', border: 'none', fontWeight: 600, height: 48 }}>
              {t('login_system')}
            </Button>
          </Form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher currentLang={lang} onLangChange={setLang} />
          </div>
        </Card>
      </div>
    );
  }

  // ====================== APP LAYOUT ======================
  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafb' }}>
      {appMode === 'admin' && !isMobile && (
        <Sider theme="light" width={280} style={{ borderRight: '1px solid #e5e7eb', background: '#fff' }}>
          <div style={{ padding: '24px 20px', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, color: '#1f2f61', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><LaptopOutlined /></div>
            {t('admin_panel')}
          </div>

          {/* ✅ FIX: menu использует activePage, а не currentPage */}
          <Menu
            mode="inline"
            selectedKeys={[activePage]}
            items={menuItems}
            onClick={(e) => {
              if (e.key === 'logout') setAppMode('public');
              else setActivePage(e.key);
            }}
            style={{ border: 'none' }}
          />

          <div style={{ padding: '20px' }}>
            <LanguageSwitcher currentLang={lang} onLangChange={setLang} />
          </div>
        </Sider>
      )}

      <Layout>
        <Header style={{ background: '#fff', padding: isMobile ? '0 16px' : '0 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', height: isMobile ? 64 : 72, boxShadow: '0 2px 16px rgba(31, 47, 97, 0.08)' }}>
          {appMode === 'admin' && isMobile && (
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} style={{ fontSize: 20 }} />
          )}

          {appMode === 'public' ? (
            <div className="mobile-header-logo" style={{ fontSize: isMobile ? '16px' : '22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, color: '#1f2f61' }}>
              <div style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><LaptopOutlined /></div>
              {!isMobile && 'InnoTechnopark'} {!isMobile && <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', marginLeft: 12, backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>{t('public_portal')}</span>}
            </div>
          ) : (
            <Input
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              placeholder={t('search_placeholder')}
              style={{ width: 320, borderRadius: 10, background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '10px 16px' }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            {appMode === 'public' ? (
              <>
                {!isMobile && <LanguageSwitcher currentLang={lang} onLangChange={setLang} />}
                <Button className={isMobile ? 'mobile-hide-text' : ''} type="default" icon={<LockOutlined />} onClick={() => setIsAdminLoginModalOpen(true)} style={{ borderRadius: 8, borderColor: '#e5e7eb', color: '#374151' }}>
                  {!isMobile && t('login_admin')}
                </Button>
              </>
            ) : (
              <Button className={isMobile ? 'mobile-hide-text' : ''} type="default" icon={<ArrowLeftOutlined />} onClick={() => setAppMode('public')} style={{ borderRadius: 8, borderColor: '#e5e7eb' }}>
                {!isMobile && t('back_to_site')}
              </Button>
            )}
            <Tooltip title="Exit System">
              <Button type="text" danger icon={<PoweroffOutlined />} onClick={handleGlobalLogout} style={{ color: '#ef4444', borderRadius: 8 }} />
            </Tooltip>
          </div>
        </Header>

        <Content style={{ padding: isMobile ? '16px 12px' : '40px 60px' }}>
          <div style={{ margin: '0 auto', maxWidth: appMode === 'public' ? undefined : 1600 }}>
            {appMode === 'public' && (
              <Row gutter={isMobile ? 8 : 16} style={{ marginBottom: isMobile ? 16 : 24 }}>
                <Col xs={12} sm={12} md={6}>
                  <Card variant="borderless">
                    <Statistic
                      title={<span style={{ color: '#0369a1', fontWeight: 600 }}>{t('total_devices')}</span>}
                      value={allDevices?.length || 0}
                      prefix={<LaptopOutlined style={{ color: '#0284c7' }} />}
                      styles={{ content: { color: '#0369a1', fontSize: isMobile ? 20 : 32, fontWeight: 700 } }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card variant="borderless">
                    <Statistic
                      title={<span style={{ color: '#15803d', fontWeight: 600 }}>{t('assigned')}</span>}
                      value={(allDevices || []).filter(d => d.owner_name).length}
                      prefix={<UserOutlined style={{ color: '#22c55e' }} />}
                      styles={{ content: { color: '#15803d', fontSize: isMobile ? 20 : 32, fontWeight: 700 } }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card variant="borderless">
                    <Statistic
                      title={<span style={{ color: '#991b1b', fontWeight: 600 }}>{t('broken')}</span>}
                      value={(allDevices || []).filter(d => d.status === 'broken').length}
                      prefix={<SettingTwoTone style={{ color: '#dc2626' }} />}
                      styles={{ content: { color: '#991b1b', fontSize: isMobile ? 20 : 32, fontWeight: 700 } }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card variant="borderless">
                    <Statistic
                      title={<span style={{ color: '#be185d', fontWeight: 600 }}>{t('rooms')}</span>}
                      value={rooms?.length || 0}
                      prefix={<BankOutlined style={{ color: '#ec4899' }} />}
                      styles={{ content: { color: '#be185d', fontSize: isMobile ? 20 : 32, fontWeight: 700 } }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            <div style={{ background: '#fff', padding: 32, borderRadius: 16, minHeight: '80vh', boxShadow: '0 4px 24px rgba(31, 47, 97, 0.08)', border: '1px solid #e5e7eb' }}>
              {/* ✅ FIX: используем activePage, а не currentPage */}
              {appMode === 'admin' && activePage === 'references' ? (
                <Tabs
                  defaultActiveKey="1"
                  items={[
                    {
                      key: '1',
                      label: <span><TeamOutlined /> Сотрудники</span>,
                      children: (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateEmployeeModal}>{t('add_employee')}</Button>
                          </div>
                          <Table columns={empColumns} dataSource={filteredEmployees} rowKey="id" />
                        </>
                      )
                    },
                    {
                      key: '2',
                      label: <span><BankOutlined /> Комнаты</span>,
                      children: (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRoomModal}>{t('add_room')}</Button>
                          </div>
                          <Table columns={roomColumns} dataSource={rooms} rowKey="id" />
                        </>
                      )
                    },
                    {
                      key: '3',
                      label: <span><AppstoreOutlined /> Категории</span>,
                      children: (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCategoryModal}>Добавить Категорию</Button>
                          </div>
                          <Table columns={categoryColumns} dataSource={categories} rowKey="id" />
                        </>
                      )
                    }
                  ]}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    {appMode === 'public' && (
                      <Input
                        prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
                        placeholder={t('search_placeholder')}
                        style={{ width: 300, borderRadius: 8 }}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                      />
                    )}

                    <Space wrap>
                      {appMode === 'admin' && (
                        <>
                          <Button icon={<DownloadOutlined />} onClick={handleExport}>Экспорт (Excel)</Button>
                          <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>Импорт (Excel)</Button>
                          <Button icon={<PrinterOutlined />} disabled={selectedDevices.length === 0} onClick={handlePrintQR}>Печать QR ({selectedDevices.length})</Button>
                        </>
                      )}

                      <Select placeholder={t('rooms')} style={{ width: 140 }} allowClear value={filterRoom} onChange={setFilterRoom}>
                        {rooms.map(r => <Option key={r.id} value={r.id}>{r.room_name}</Option>)}
                      </Select>

                      <Select placeholder={t('label_cat')} style={{ width: 140 }} allowClear value={filterCategory} onChange={setFilterCategory}>
                        {categories.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
                      </Select>

                      <Select placeholder={t('label_status')} style={{ width: 140 }} allowClear value={filterStatus} onChange={setFilterStatus}>
                        <Option value="working">{lang === 'uz' ? 'Ishlayapti' : 'В работе'}</Option>
                        <Option value="in_stock">{lang === 'uz' ? 'Omborda' : 'На складе'}</Option>
                        <Option value="repair">{lang === 'uz' ? "Ta'mirda" : 'В ремонте'}</Option>
                        <Option value="broken">{lang === 'uz' ? 'Buzilgan' : 'Сломано'}</Option>
                        <Option value="decommissioned">{lang === 'uz' ? 'Hisobdan chiqarilgan' : 'Списано'}</Option>
                      </Select>

                      <Button type="text" danger onClick={resetFilters}>{t('reset_filter')}</Button>
                    </Space>

                    {appMode === 'admin' && <Button type="primary" icon={<PlusOutlined />} onClick={openCreateProductModal}>{t('add_product')}</Button>}
                  </div>

                  <div className="mobile-table-wrapper" style={{ overflowX: 'auto' }}>
                    <Table
                      columns={appMode === 'admin' ? adminColumns : publicColumns}
                      dataSource={pagedDevices}  // ✅ FIX
                      loading={loading}
                      rowSelection={appMode === 'admin' ? {
                        selectedRowKeys: selectedDevices,
                        onChange: (keys) => setSelectedDevices(keys)
                      } : undefined}
                      pagination={{
                        current: safeCurrent,        // ✅ FIX
                        pageSize: safePageSize,      // ✅ FIX
                        total: totalFiltered,        // ✅ FIX
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: () => {
                          const from = totalFiltered === 0 ? 0 : startIndex + 1;
                          const to = Math.min(endIndex, totalFiltered);
                          return `${from}-${to} из ${totalFiltered}`;
                        },
                        onChange: (page, size) => {
                          setCurrentPage(page >= 1 ? page : 1);
                          setPageSize(size >= 1 ? size : 10);
                        },
                        onShowSizeChange: (_, size) => {
                          setCurrentPage(1);
                          setPageSize(size >= 1 ? size : 10);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </Content>

        <Modal title={t('modal_admin_access')} open={isAdminLoginModalOpen} onCancel={() => setIsAdminLoginModalOpen(false)} footer={null} width={300}>
          <Input.Password placeholder={t('enter_pass')} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onPressEnter={handleAdminLogin} />
          <Button type="primary" block style={{ marginTop: 15 }} onClick={handleAdminLogin}>{t('login_btn')}</Button>
        </Modal>

        {/* IMPORT MODAL */}
        <Modal title="Импорт из Excel" open={isImportModalOpen} onCancel={() => setIsImportModalOpen(false)} footer={null}>
          <p>Загрузите файл .xlsx. Колонки: Название, Категория, Прайс, Инв. номер, Статус, Комната.</p>
          <Upload.Dragger customRequest={handleImport} showUploadList={false}>
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">Нажмите или перетащите файл сюда</p>
          </Upload.Dragger>
        </Modal>

        <SharedModals
          t={t} isProductModalOpen={isProductModalOpen} setIsProductModalOpen={setIsProductModalOpen}
          productForm={productForm} handleSaveProduct={handleSaveProduct} rooms={rooms} categories={categories} employees={employees}
          editingDevice={editingDevice} handleDeleteDevice={handleDeleteDevice}
          isEmployeeModalOpen={isEmployeeModalOpen} setIsEmployeeModalOpen={setIsEmployeeModalOpen}
          employeeForm={employeeForm} handleSaveEmployee={handleSaveEmployee} editingEmployee={editingEmployee}
          isRoomModalOpen={isRoomModalOpen} setIsRoomModalOpen={setIsRoomModalOpen} roomForm={roomForm} handleSaveRoom={handleSaveRoom} editingRoom={editingRoom}
          isCategoryModalOpen={isCategoryModalOpen} setIsCategoryModalOpen={setIsCategoryModalOpen} categoryForm={categoryForm} handleSaveCategory={handleSaveCategory} editingCategory={editingCategory}
          isViewModalOpen={isViewModalOpen} setIsViewModalOpen={setIsViewModalOpen} viewDevice={viewDevice}
          downloadQRCode={downloadQRCode}
          lang={lang}
        />

        <Modal title={selectedUser?.full_name + "'s Assets"} open={isUserAssetsModalOpen} onCancel={() => setIsUserAssetsModalOpen(false)} footer={null}>
          {selectedUser && selectedUser.devices_list?.length > 0 ? (
            <List dataSource={selectedUser.devices_list} renderItem={item => (
              <List.Item><Tag color="blue">Asset</Tag> {item}</List.Item>
            )} />
          ) : (
            <Empty description="No assets" />
          )}
        </Modal>

        {/* Mobile Drawer */}
        <Drawer
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><LaptopOutlined /> {t('admin_panel')}</div>}
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          size="default"               // ✅ вместо width (deprecated)
          style={{ width: 280 }}       // чтобы визуально осталось как раньше
        >
          <Menu
            mode="inline"
            selectedKeys={[activePage]}
            items={menuItems}
            onClick={(e) => {
              if (e.key === 'logout') {
                setAppMode('public');
                setDrawerVisible(false);
              } else {
                setActivePage(e.key);
                setDrawerVisible(false);
              }
            }}
            style={{ border: 'none' }}
          />
          <div style={{ padding: '20px' }}>
            <LanguageSwitcher currentLang={lang} onLangChange={setLang} />
          </div>
        </Drawer>
      </Layout>
    </Layout>
  );
}

const SharedModals = ({
  t, isProductModalOpen, setIsProductModalOpen, productForm, handleSaveProduct, rooms, categories, employees, editingDevice, handleDeleteDevice,
  isEmployeeModalOpen, setIsEmployeeModalOpen, employeeForm, handleSaveEmployee, editingEmployee,
  isRoomModalOpen, setIsRoomModalOpen, roomForm, handleSaveRoom, editingRoom,
  isCategoryModalOpen, setIsCategoryModalOpen, categoryForm, handleSaveCategory, editingCategory,
  isViewModalOpen, setIsViewModalOpen, viewDevice, downloadQRCode, lang
}) => (
  <>
    <Modal title={editingDevice ? t('modal_prod_title_edit') : t('modal_prod_title_add')} open={isProductModalOpen} onCancel={() => setIsProductModalOpen(false)} footer={null} width={700}>
      <Form form={productForm} layout="vertical" onFinish={handleSaveProduct}>
        <Row gutter={16}>
          <Col span={12}><Form.Item name="name" label={<b>{t('label_name')}</b>} rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="type" label={<b>{t('label_cat')}</b>} rules={[{ required: true }]}><Select>{categories && categories.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}</Select></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}><Form.Item name="inventory_number" label={<b>{t('col_inv')}</b>}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="price" label={<b>Прайс</b>}><Input placeholder="Например: 1200$" /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}><Form.Item name="room_id" label={<b>{t('col_location')}</b>} rules={[{ required: true }]}><Select>{rooms.map(r => <Option key={r.id} value={r.id}>{r.room_name}</Option>)}</Select></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="status" label={<b>{t('label_status')}</b>}>
              <Select>
                <Option value="working">{lang === 'uz' ? 'Ishlayapti' : 'В работе'}</Option>
                <Option value="in_stock">{lang === 'uz' ? 'Omborda' : 'На складе'}</Option>
                <Option value="repair">{lang === 'uz' ? "Ta'mirda" : 'В ремонте'}</Option>
                <Option value="broken">{lang === 'uz' ? 'Buzilgan' : 'Сломано'}</Option>
                <Option value="decommissioned">{lang === 'uz' ? 'Hisobdan chiqarilgan' : 'Списано'}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="employee_id" label={<b>{t('label_assign')}</b>}>
          <Select placeholder="Select..." allowClear showSearch optionFilterProp="children">
            {employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="details" label={<b>{t('label_details')}</b>}><TextArea rows={3} /></Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button type="primary" htmlType="submit">{t('save_btn')}</Button>
          {editingDevice && (
            <Popconfirm title={t('delete_confirm')} onConfirm={() => handleDeleteDevice(editingDevice.id)}>
              <Button danger>{t('delete_confirm')}</Button>
            </Popconfirm>
          )}
        </div>
      </Form>
    </Modal>

    <Modal title={editingEmployee ? "Редактировать сотрудника" : t('modal_reg_self')} open={isEmployeeModalOpen} onCancel={() => setIsEmployeeModalOpen(false)} footer={null}>
      <Form form={employeeForm} layout="vertical" onFinish={handleSaveEmployee}>
        <Form.Item name="full_name" label={<b>{t('col_full_name')}</b>} rules={[{ required: true }]}><Input placeholder={t('ph_name')} /></Form.Item>
        <Form.Item name="position" label={<b>{t('label_position')}</b>} rules={[{ required: true }]}><Input placeholder={t('ph_pos')} /></Form.Item>
        <Button type="primary" htmlType="submit" block size="large">{t('create_btn')}</Button>
      </Form>
    </Modal>

    <Modal title={editingRoom ? "Редактировать комнату" : t('modal_room_title')} open={isRoomModalOpen} onCancel={() => setIsRoomModalOpen(false)} footer={null}>
      <Form form={roomForm} layout="vertical" onFinish={handleSaveRoom}>
        <Form.Item name="name" label={<b>{t('label_name')}</b>} rules={[{ required: true }]}><Input /></Form.Item>
        <Button type="primary" htmlType="submit" block>{t('create_btn')}</Button>
      </Form>
    </Modal>

    <Modal title={editingCategory ? "Редактировать категорию" : "Добавить Категорию"} open={isCategoryModalOpen} onCancel={() => setIsCategoryModalOpen(false)} footer={null}>
      <Form form={categoryForm} layout="vertical" onFinish={handleSaveCategory}>
        <Form.Item name="name" label={<b>Название категории</b>} rules={[{ required: true }]}><Input placeholder="Например: Ноутбуки" /></Form.Item>
        <Button type="primary" htmlType="submit" block>{t('create_btn')}</Button>
      </Form>
    </Modal>

    <Modal title="Информация об устройстве" open={isViewModalOpen} onCancel={() => setIsViewModalOpen(false)} footer={null} width={400}>
      {viewDevice && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#f0f2f5', padding: 20, borderRadius: 12, marginBottom: 20, display: 'inline-block' }}>
            <QRCodeCanvas
              id="qr-gen"
              value={`${window.location.origin}/?qr_id=${viewDevice.id}`}
              size={150}
            />
            <div style={{ marginTop: 10, fontWeight: 'bold', color: '#555' }}>{viewDevice.inventory_number}</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Button type="dashed" icon={<DownloadOutlined />} onClick={downloadQRCode}>Скачать QR</Button>
          </div>

          <Descriptions bordered column={1} size="small" style={{ textAlign: 'left' }}>
            <Descriptions.Item label={t('col_product')}>{viewDevice.name}</Descriptions.Item>
            <Descriptions.Item label={t('label_cat')}>{viewDevice.type}</Descriptions.Item>
            <Descriptions.Item label="Прайс">{viewDevice.price}</Descriptions.Item>
            <Descriptions.Item label={t('col_location')}>{viewDevice.room_name}</Descriptions.Item>
            <Descriptions.Item label={t('col_user')}>{viewDevice.owner_name || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('col_status')}><Tag>{viewDevice.status}</Tag></Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Modal>
  </>
);

export default App;