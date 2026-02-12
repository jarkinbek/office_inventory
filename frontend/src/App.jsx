import { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Table, Tag, Input, Select, Modal, Form,
  message, Row, Col, Typography, Space, Popconfirm, Card, Statistic, Tooltip, Upload, Drawer
} from 'antd';
import {
  AppstoreOutlined, UserOutlined, LogoutOutlined, PlusOutlined, SearchOutlined,
  FilterOutlined, DeleteOutlined, EditOutlined, BankOutlined, EyeOutlined,
  LockOutlined, ArrowLeftOutlined, LaptopOutlined, TeamOutlined,
  BookOutlined, DownloadOutlined, UploadOutlined, MenuOutlined, PrinterOutlined
} from '@ant-design/icons';

// --- NEW IMPORTS: HOOKS, COMPONENTS, UTILS ---
import { useAuth, useData, useCRUD } from './hooks';
import { SharedModals, LanguageSwitcher } from './components';
import { translations } from './utils/translations';
import { getStatusColor, getStatusLabel, downloadQRCode } from './utils/helpers';
import './responsive.css';
import './modern-design.css';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

function App() {
  const [lang, setLang] = useState('ru');
  const t = (key) => translations[lang][key] || key;

  // --- CUSTOM HOOKS ---
  const { isAuthenticated, appMode, login, logout, enterAdminMode, exitAdminMode } = useAuth();
  const { rooms, allDevices, employees, categories, loading, fetchData, setAllDevices } = useData(isAuthenticated);
  const crud = useCRUD(fetchData, t);

  // --- LOCAL STATE ---
  const [activePage, setActivePage] = useState('dashboard');
  const [loginForm] = Form.useForm();

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterRoom, setFilterRoom] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  // Mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // QR Mass Print
  const [selectedDevices, setSelectedDevices] = useState([]);

  // QR Card Mode - shows only device card when opened from QR scan
  const [isQRMode, setIsQRMode] = useState(false);
  const [qrDevice, setQrDevice] = useState(null);

  // Modals
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isUserAssetsModalOpen, setIsUserAssetsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Editing states
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewDevice, setViewDevice] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');

  // Forms
  const [productForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [employeeForm] = Form.useForm();

  // --- LOGIN/LOGOUT HANDLERS ---
  const handleGlobalLogin = async (values) => {
    const result = await login(values.username, values.password);
    if (result.success) {
      message.success(t('welcome_user'));
    } else {
      message.error(t('wrong_pass'));
    }
  };

  const handleGlobalLogout = () => {
    logout();
    setActivePage('dashboard');
    setAppMode('public');
    message.info(t('logout'));
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      enterAdminMode();
      setIsAdminLoginModalOpen(false);
      setAdminPassword('');
      message.success(t('welcome_admin'));
    } else {
      message.error(t('wrong_pass'));
    }
  };

  // --- QR HANDLING ON PAGE LOAD ---
  useEffect(() => {
    const checkQRParam = async () => {
      const params = new URLSearchParams(window.location.search);
      const qrId = params.get('qr_id');
      if (qrId && allDevices.length > 0) {
        const targetDevice = allDevices.find(d => d.id === parseInt(qrId));
        if (targetDevice) {
          setQrDevice(targetDevice);
          setIsQRMode(true);
        }
      }
    };
    checkQRParam();
  }, [allDevices]);

  // --- MOBILE RESIZE ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FILTERS RESET PAGE ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterRoom, filterCategory, filterStatus, activePage]);

  // --- EXPORT/IMPORT ---
  const handleExport = () => crud.handleExport(lang);

  const handlePrintQR = async () => {
    const success = await crud.handlePrintQR(selectedDevices, t);
    if (success) setSelectedDevices([]);
  };

  const handleImport = async (options) => {
    await crud.handleImport(options.file, options.onSuccess, options.onError);
    setIsImportModalOpen(false);
  };

  // --- MODAL OPENERS ---
  const openCreateProductModal = () => { setEditingDevice(null); productForm.resetFields(); setIsProductModalOpen(true); };
  const openEditProductModal = (record) => { setEditingDevice(record); productForm.setFieldsValue(record); setIsProductModalOpen(true); };
  const openCreateEmployeeModal = () => { setEditingEmployee(null); employeeForm.resetFields(); setIsEmployeeModalOpen(true); };
  const openEditEmployeeModal = (record) => { setEditingEmployee(record); employeeForm.setFieldsValue(record); setIsEmployeeModalOpen(true); };
  const openCreateRoomModal = () => { setEditingRoom(null); roomForm.resetFields(); setIsRoomModalOpen(true); };
  const openEditRoomModal = (record) => { setEditingRoom(record); roomForm.setFieldsValue(record); setIsRoomModalOpen(true); };
  const openCreateCategoryModal = () => { setEditingCategory(null); categoryForm.resetFields(); setIsCategoryModalOpen(true); };
  const openEditCategoryModal = (record) => { setEditingCategory(record); categoryForm.setFieldsValue(record); setIsCategoryModalOpen(true); };
  const openViewModal = (record) => { setViewDevice(record); setIsViewModalOpen(true); };

  // --- CRUD HANDLERS ---
  const handleSaveProduct = async (values) => {
    await crud.saveDevice(values, editingDevice);
    setIsProductModalOpen(false);
    productForm.resetFields();
  };

  const handleSaveEmployee = async (values) => {
    await crud.saveEmployee(values, editingEmployee);
    setIsEmployeeModalOpen(false);
    employeeForm.resetFields();
  };

  const handleSaveRoom = async (values) => {
    await crud.saveRoom(values, editingRoom);
    setIsRoomModalOpen(false);
    roomForm.resetFields();
  };

  const handleSaveCategory = async (values) => {
    await crud.saveCategory(values, editingCategory);
    setIsCategoryModalOpen(false);
    categoryForm.resetFields();
  };

  // --- FILTERED DATA ---
  const filteredDevices = allDevices.filter(d => {
    const matchSearch = !searchText ||
      d.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      d.inventory_number?.toLowerCase().includes(searchText.toLowerCase()) ||
      d.owner_name?.toLowerCase().includes(searchText.toLowerCase());
    const matchRoom = !filterRoom || d.room_id === filterRoom;
    const matchCategory = !filterCategory || d.type === filterCategory;
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchRoom && matchCategory && matchStatus;
  });

  const paginatedDevices = filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- STATS ---
  const stats = {
    total: allDevices.length,
    assigned: allDevices.filter(d => d.employee_id).length,
    broken: allDevices.filter(d => d.status === 'broken' || d.status === 'repair').length,
    rooms: rooms.length
  };

  // --- TABLE COLUMNS ---
  const adminColumns = [
    {
      title: t('col_id'),
      dataIndex: 'id',
      width: 60,
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
      title: t('col_inv'),
      dataIndex: 'inventory_number',
      width: 120,
      render: (text, record) => (
        <a onClick={() => openViewModal(record)} style={{ color: '#1890ff', cursor: 'pointer' }}>
          {text || '-'}
        </a>
      )
    },
    { title: t('col_product'), dataIndex: 'name' },
    { title: t('label_cat'), dataIndex: 'type' },
    { title: t('col_location'), dataIndex: 'room_name' },
    { title: t('col_user'), dataIndex: 'owner_name' },
    {
      title: t('col_status'),
      dataIndex: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusLabel(status, lang)}</Tag>
    },
    {
      title: t('col_action'),
      render: (_, rec) => (
        <Space>
          <Tooltip title="View"><Button icon={<EyeOutlined />} size="small" onClick={() => openViewModal(rec)} /></Tooltip>
          {appMode === 'admin' && (
            <>
              <Tooltip title="Edit"><Button icon={<EditOutlined />} size="small" onClick={() => openEditProductModal(rec)} /></Tooltip>
              <Popconfirm title={t('delete_confirm')} onConfirm={() => crud.deleteDevice(rec.id)}>
                <Button icon={<DeleteOutlined />} size="small" danger />
              </Popconfirm>
            </>
          )}
          <Tooltip title="Скопировать ссылку">
            <Button size="small" icon={<BookOutlined />} onClick={() => {
              const link = `${window.location.origin}/?qr_id=${rec.id}`;
              try {
                const textArea = document.createElement('textarea');
                textArea.value = link;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                message.success('Ссылка скопирована: ' + link);
              } catch (err) {
                prompt('Скопируйте ссылку:', link);
              }
            }} />
          </Tooltip>
        </Space>
      )
    }
  ];

  // --- RENDER QR CARD MODE (only device card, no app UI) ---
  if (isQRMode && qrDevice) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <Card
            style={{
              width: '100%',
              maxWidth: 500,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: 'none'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              margin: '-24px -24px 24px -24px',
              padding: '30px 24px',
              textAlign: 'center'
            }}>
              <LaptopOutlined style={{ fontSize: 48, color: 'white', marginBottom: 12 }} />
              <Typography.Title level={3} style={{ color: 'white', margin: 0 }}>
                {qrDevice.name}
              </Typography.Title>
              <Tag color={getStatusColor(qrDevice.status)} style={{ marginTop: 8, fontSize: 14, padding: '4px 16px' }}>
                {getStatusLabel(qrDevice.status, lang)}
              </Tag>
            </div>

            {/* Device Info */}
            <div style={{ fontSize: 16 }}>
              <Row gutter={[16, 20]}>
                <Col span={12}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{t('col_inv')}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 18, color: '#1a1a2e' }}>{qrDevice.inventory_number || '-'}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{t('label_cat')}</div>
                  <div style={{ fontWeight: 'bold', color: '#1a1a2e' }}>{qrDevice.type || '-'}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{t('col_location')}</div>
                  <div style={{ fontWeight: 'bold', color: '#1a1a2e' }}><BankOutlined /> {qrDevice.room_name || '-'}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{t('col_user')}</div>
                  <div style={{ fontWeight: 'bold', color: '#1a1a2e' }}><UserOutlined /> {qrDevice.owner_name || '-'}</div>
                </Col>
                {qrDevice.price && (
                  <Col span={12}>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{t('col_price') || 'Цена'}</div>
                    <div style={{ fontWeight: 'bold', color: '#1a1a2e' }}>{qrDevice.price}</div>
                  </Col>
                )}
                {qrDevice.details && (
                  <Col span={24}>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{t('label_details')}</div>
                    <div style={{ color: '#555', background: '#f5f5f5', padding: '8px 12px', borderRadius: 8 }}>{qrDevice.details}</div>
                  </Col>
                )}
              </Row>
            </div>

            {/* No back button - QR card is standalone */}
          </Card>
        </Content>
      </Layout>
    );
  }

  // --- RENDER IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ width: 400, textAlign: 'center' }}>
            <Typography.Title level={2}>{t('site_access')}</Typography.Title>
            <Form form={loginForm} onFinish={handleGlobalLogin}>
              <Form.Item name="username" rules={[{ required: true }]}>
                <Input prefix={<UserOutlined />} placeholder={t('username')} size="large" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true }]}>
                <Input.Password prefix={<LockOutlined />} placeholder={t('password')} size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>{t('login_system')}</Button>
            </Form>
          </Card>
        </Content>
      </Layout>
    );
  }

  // --- MAIN APP LAYOUT ---
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* HEADER */}
      <Header className="gradient-header" style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isMobile && <Button icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)} style={{ marginRight: 16 }} />}
        <Typography.Title level={3} style={{ margin: 0 }}>
          {appMode === 'admin' ? t('admin_panel') : 'InnoTechnopark'}
        </Typography.Title>
        <Space>
          <LanguageSwitcher currentLang={lang} onLangChange={setLang} />
          {appMode === 'admin' && <Button icon={<ArrowLeftOutlined />} onClick={exitAdminMode}>{t('back_to_site')}</Button>}
          {appMode === 'public' && <Button icon={<LockOutlined />} onClick={() => setIsAdminLoginModalOpen(true)}>{t('login_admin')}</Button>}
          <Button icon={<LogoutOutlined />} onClick={handleGlobalLogout}>{t('logout')}</Button>
        </Space>
      </Header>

      <Layout>
        {/* SIDEBAR */}
        {!isMobile ? (
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu mode="inline" selectedKeys={[activePage]} style={{ height: '100%', borderRight: 0 }} onClick={(e) => setActivePage(e.key)}>
              <Menu.Item key="dashboard" icon={<AppstoreOutlined />}>{t('dashboard')}</Menu.Item>
              {appMode === 'admin' && <Menu.Item key="users" icon={<UserOutlined />}>{t('users')}</Menu.Item>}
              {appMode === 'admin' && <Menu.Item key="settings" icon={<BankOutlined />}>{t('settings')}</Menu.Item>}
            </Menu>
          </Sider>
        ) : (
          <Drawer title="Menu" placement="left" onClose={() => setDrawerVisible(false)} open={drawerVisible}>
            <Menu mode="inline" selectedKeys={[activePage]} onClick={(e) => { setActivePage(e.key); setDrawerVisible(false); }}>
              <Menu.Item key="dashboard" icon={<AppstoreOutlined />}>{t('dashboard')}</Menu.Item>
              {appMode === 'admin' && <Menu.Item key="users" icon={<UserOutlined />}>{t('users')}</Menu.Item>}
              {appMode === 'admin' && <Menu.Item key="settings" icon={<BankOutlined />}>{t('settings')}</Menu.Item>}
            </Menu>
          </Drawer>
        )}

        {/* MAIN CONTENT */}
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
            {activePage === 'dashboard' && (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }} className="fade-in">
                  <Col xs={24} sm={12} md={6}>
                    <Card className="stats-card">
                      <Statistic
                        title={<span style={{ color: '#0369a1', fontWeight: 600 }}>{t('total_devices')}</span>}
                        value={stats.total}
                        prefix={<div className="icon-container blue"><LaptopOutlined /></div>}
                        valueStyle={{ color: '#0369a1', fontSize: 32, fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="stats-card">
                      <Statistic
                        title={<span style={{ color: '#15803d', fontWeight: 600 }}>{t('assigned')}</span>}
                        value={stats.assigned}
                        prefix={<div className="icon-container green"><UserOutlined /></div>}
                        valueStyle={{ color: '#15803d', fontSize: 32, fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="stats-card">
                      <Statistic
                        title={<span style={{ color: '#991b1b', fontWeight: 600 }}>{t('broken')}</span>}
                        value={stats.broken}
                        prefix={<div className="icon-container red"><LaptopOutlined /></div>}
                        valueStyle={{ color: '#991b1b', fontSize: 32, fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="stats-card">
                      <Statistic
                        title={<span style={{ color: '#be185d', fontWeight: 600 }}>{t('rooms')}</span>}
                        value={stats.rooms}
                        prefix={<div className="icon-container purple"><BankOutlined /></div>}
                        valueStyle={{ color: '#be185d', fontSize: 32, fontWeight: 700 }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                  {appMode === 'admin' && <Button type="primary" icon={<PlusOutlined />} onClick={openCreateProductModal}>{t('add_product')}</Button>}
                  {appMode === 'admin' && <Button icon={<DownloadOutlined />} onClick={handleExport}>Export Excel</Button>}
                  {appMode === 'admin' && <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>Import Excel</Button>}
                  {appMode === 'admin' && <Button icon={<PrinterOutlined />} disabled={selectedDevices.length === 0} onClick={handlePrintQR}>Печать QR ({selectedDevices.length})</Button>}
                </Space>

                <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                  <Input.Search placeholder={t('search_placeholder')} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 250 }} />
                  <Select placeholder={t('col_location')} value={filterRoom} onChange={setFilterRoom} allowClear style={{ width: 150 }}>
                    {rooms.map(r => <Option key={r.id} value={r.id}>{r.room_name}</Option>)}
                  </Select>
                  <Select placeholder={t('label_cat')} value={filterCategory} onChange={setFilterCategory} allowClear style={{ width: 150 }}>
                    {categories.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
                  </Select>
                  <Select placeholder={t('label_status')} value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 150 }}>
                    <Option value="working">{getStatusLabel('working', lang)}</Option>
                    <Option value="in_stock">{getStatusLabel('in_stock', lang)}</Option>
                    <Option value="repair">{getStatusLabel('repair', lang)}</Option>
                    <Option value="broken">{getStatusLabel('broken', lang)}</Option>
                  </Select>
                  <Button icon={<FilterOutlined />} onClick={() => { setSearchText(''); setFilterRoom(null); setFilterCategory(null); setFilterStatus(null); }}>{t('reset_filter')}</Button>
                </Space>


                <div className="modern-table">
                  <Table
                    columns={adminColumns}
                    dataSource={paginatedDevices}
                    loading={loading}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: filteredDevices.length,
                      showSizeChanger: true,
                      onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
                    }}
                    rowSelection={appMode === 'admin' ? {
                      selectedRowKeys: selectedDevices,
                      onChange: (keys) => setSelectedDevices(keys)
                    } : undefined}
                  />
                </div>
              </>
            )}

            {activePage === 'users' && appMode === 'admin' && (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateEmployeeModal} style={{ marginBottom: 16 }}>{t('add_employee')}</Button>
                <Table
                  dataSource={employees}
                  columns={[
                    { title: t('col_full_name'), dataIndex: 'full_name' },
                    { title: t('col_position'), dataIndex: 'position' },
                    {
                      title: t('col_action'),
                      render: (_, rec) => (
                        <Space>
                          <Button size="small" onClick={() => openEditEmployeeModal(rec)}>Edit</Button>
                          <Popconfirm title={t('delete_confirm')} onConfirm={() => crud.deleteEmployee(rec.id)}>
                            <Button size="small" danger>Delete</Button>
                          </Popconfirm>
                        </Space>
                      )
                    }
                  ]}
                />
              </>
            )}

            {activePage === 'settings' && appMode === 'admin' && (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* ROOMS SECTION */}
                <div>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateRoomModal} style={{ marginBottom: 16 }}>{t('add_room')}</Button>
                  <Table
                    dataSource={rooms}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'ID', dataIndex: 'id', width: 60 },
                      { title: t('col_location'), dataIndex: 'name' },
                      {
                        title: t('col_action'),
                        width: 120,
                        render: (_, rec) => (
                          <Space>
                            <Button size="small" onClick={() => openEditRoomModal(rec)}>Edit</Button>
                            <Popconfirm title={t('delete_confirm')} onConfirm={() => crud.deleteRoom(rec.id)}>
                              <Button size="small" danger>Delete</Button>
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>

                {/* CATEGORIES SECTION */}
                <div>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCategoryModal} style={{ marginBottom: 16 }}>Добавить категорию</Button>
                  <Table
                    dataSource={categories}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'ID', dataIndex: 'id', width: 60 },
                      { title: t('label_cat'), dataIndex: 'name' },
                      {
                        title: t('col_action'),
                        width: 120,
                        render: (_, rec) => (
                          <Space>
                            <Button size="small" onClick={() => openEditCategoryModal(rec)}>Edit</Button>
                            <Popconfirm title={t('delete_confirm')} onConfirm={() => crud.deleteCategory(rec.id)}>
                              <Button size="small" danger>Delete</Button>
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]}
                  />
                </div>
              </Space>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* MODALS */}
      <SharedModals
        t={t}
        lang={lang}
        isProductModalOpen={isProductModalOpen}
        setIsProductModalOpen={setIsProductModalOpen}
        productForm={productForm}
        handleSaveProduct={handleSaveProduct}
        rooms={rooms}
        categories={categories}
        employees={employees}
        editingDevice={editingDevice}
        handleDeleteDevice={crud.deleteDevice}
        isEmployeeModalOpen={isEmployeeModalOpen}
        setIsEmployeeModalOpen={setIsEmployeeModalOpen}
        employeeForm={employeeForm}
        handleSaveEmployee={handleSaveEmployee}
        editingEmployee={editingEmployee}
        isRoomModalOpen={isRoomModalOpen}
        setIsRoomModalOpen={setIsRoomModalOpen}
        roomForm={roomForm}
        handleSaveRoom={handleSaveRoom}
        editingRoom={editingRoom}
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        categoryForm={categoryForm}
        handleSaveCategory={handleSaveCategory}
        editingCategory={editingCategory}
        isViewModalOpen={isViewModalOpen}
        setIsViewModalOpen={setIsViewModalOpen}
        viewDevice={viewDevice}
        downloadQRCode={downloadQRCode}
      />

      {/* ADMIN LOGIN MODAL */}
      <Modal title={t('modal_admin_access')} open={isAdminLoginModalOpen} onCancel={() => setIsAdminLoginModalOpen(false)} footer={null}>
        <Input.Password placeholder={t('enter_pass')} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} onPressEnter={handleAdminLogin} size="large" />
        <Button type="primary" onClick={handleAdminLogin} block style={{ marginTop: 16 }} size="large">{t('login_btn')}</Button>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal title="Import Excel" open={isImportModalOpen} onCancel={() => setIsImportModalOpen(false)} footer={null}>
        <Upload customRequest={handleImport} maxCount={1} accept=".xlsx">
          <Button icon={<UploadOutlined />}>Select Excel File</Button>
        </Upload>
      </Modal>
    </Layout>
  );
}

export default App;