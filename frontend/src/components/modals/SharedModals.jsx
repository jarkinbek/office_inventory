import { Modal, Form, Input, Select, Row, Col, Button, Popconfirm } from 'antd';
import { QRCodeCanvas } from 'qrcode.react';

const { Option } = Select;
const { TextArea } = Input;

/**
 * SharedModals - all modal components consolidated
 * This component contains: ProductModal, EmployeeModal, RoomModal, CategoryModal, ViewDeviceModal
 */
export const SharedModals = ({
    t, lang,
    // Product Modal
    isProductModalOpen, setIsProductModalOpen, productForm, handleSaveProduct,
    rooms, categories, employees, editingDevice, handleDeleteDevice,
    // Employee Modal
    isEmployeeModalOpen, setIsEmployeeModalOpen, employeeForm, handleSaveEmployee, editingEmployee,
    // Room Modal
    isRoomModalOpen, setIsRoomModalOpen, roomForm, handleSaveRoom, editingRoom,
    // Category Modal
    isCategoryModalOpen, setIsCategoryModalOpen, categoryForm, handleSaveCategory, editingCategory,
    // View Device Modal
    isViewModalOpen, setIsViewModalOpen, viewDevice, downloadQRCode
}) => (
    <>
        {/* PRODUCT MODAL */}
        <Modal
            title={editingDevice ? t('modal_prod_title_edit') : t('modal_prod_title_add')}
            open={isProductModalOpen}
            onCancel={() => setIsProductModalOpen(false)}
            footer={null}
            width={700}
        >
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
                                <Option value="repair">{lang === 'uz' ? 'Ta\'mirda' : 'В ремонте'}</Option>
                                <Option value="broken">{lang === 'uz' ? 'Buzilgan' : 'Сломано'}</Option>
                                <Option value="decommissioned">{lang === 'uz' ? 'Hisobdan chiqarilgan' : 'Списано'}</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="employee_id" label={<b>{t('label_assign')}</b>}><Select placeholder="Select..." allowClear showSearch optionFilterProp="children">{employees.map(e => <Option key={e.id} value={e.id}>{e.full_name}</Option>)}</Select></Form.Item>
                <Form.Item name="details" label={<b>{t('label_details')}</b>}><TextArea rows={3} /></Form.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <Button type="primary" htmlType="submit">{t('save_btn')}</Button>
                    {editingDevice && <Popconfirm title={t('delete_confirm')} onConfirm={() => handleDeleteDevice(editingDevice.id)}><Button danger>{t('delete_confirm')}</Button></Popconfirm>}
                </div>
            </Form>
        </Modal>

        {/* EMPLOYEE MODAL */}
        <Modal title={editingEmployee ? "Редактировать сотрудника" : t('modal_reg_self')} open={isEmployeeModalOpen} onCancel={() => setIsEmployeeModalOpen(false)} footer={null}>
            <Form form={employeeForm} layout="vertical" onFinish={handleSaveEmployee}>
                <Form.Item name="full_name" label={<b>{t('col_full_name')}</b>} rules={[{ required: true }]}><Input placeholder={t('ph_name')} /></Form.Item>
                <Form.Item name="position" label={<b>{t('label_position')}</b>} rules={[{ required: true }]}><Input placeholder={t('ph_pos')} /></Form.Item>
                <Button type="primary" htmlType="submit" block size="large">{t('create_btn')}</Button>
            </Form>
        </Modal>

        {/* ROOM MODAL */}
        <Modal title={editingRoom ? "Редактировать комнату" : t('modal_room_title')} open={isRoomModalOpen} onCancel={() => setIsRoomModalOpen(false)} footer={null}>
            <Form form={roomForm} layout="vertical" onFinish={handleSaveRoom}>
                <Form.Item name="name" label={<b>{t('label_name')}</b>} rules={[{ required: true }]}><Input /></Form.Item>
                <Button type="primary" htmlType="submit" block>{t('create_btn')}</Button>
            </Form>
        </Modal>

        {/* CATEGORY MODAL */}
        <Modal title={editingCategory ? "Редактировать категорию" : "Добавить Категорию"} open={isCategoryModalOpen} onCancel={() => setIsCategoryModalOpen(false)} footer={null}>
            <Form form={categoryForm} layout="vertical" onFinish={handleSaveCategory}>
                <Form.Item name="name" label={<b>Название категории</b>} rules={[{ required: true }]}><Input placeholder="Например: Ноутбуки" /></Form.Item>
                <Button type="primary" htmlType="submit" block>{t('create_btn')}</Button>
            </Form>
        </Modal>

        {/* VIEW DEVICE MODAL */}
        <Modal title={t('modal_view_title')} open={isViewModalOpen} onCancel={() => setIsViewModalOpen(false)} footer={null} width={600}>
            {viewDevice && (
                <div>
                    {/* QR Label Container - ADM Style */}
                    <div id="qr-label-container" style={{
                        background: '#f5f5f5',
                        padding: '30px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '2px solid #e0e0e0'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '20px'
                        }}>
                            {/* QR Left */}
                            <div style={{ flex: '0 0 150px', textAlign: 'center' }}>
                                <QRCodeCanvas id="qr-gen" value={`${window.location.origin}/?qr_id=${viewDevice.id}`} size={150} />
                            </div>

                            {/* Logo Right - actual logo image */}
                            <div style={{ flex: '0 0 200px', textAlign: 'center' }}>
                                <img src="/logo.png" alt="InnoTechnopark" style={{ maxWidth: '180px', height: 'auto' }} />
                            </div>
                        </div>

                        {/* Inventory Number Bottom */}
                        <div style={{
                            marginTop: '15px',
                            fontSize: '28px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            letterSpacing: '2px',
                            color: '#1f2f61'
                        }}>
                            {viewDevice.inventory_number || viewDevice.id}
                        </div>
                    </div>

                    {/* Device Details */}
                    <div style={{ marginTop: 20, textAlign: 'left' }}>
                        <p><b>{t('col_inv')}:</b> {viewDevice.inventory_number || '-'}</p>
                        <p><b>{t('col_product')}:</b> {viewDevice.name}</p>
                        <p><b>{t('label_cat')}:</b> {viewDevice.type}</p>
                        <p><b>{t('col_location')}:</b> {viewDevice.room_name}</p>
                        <p><b>{t('col_user')}:</b> {viewDevice.owner_name || '-'}</p>
                        <p><b>Прайс:</b> {viewDevice.price || '-'}</p>
                        <p><b>{t('col_status')}:</b> {viewDevice.status}</p>
                        <p><b>{t('col_details')}:</b> {viewDevice.details || '-'}</p>
                    </div>
                    <Button type="primary" onClick={() => downloadQRCode(viewDevice)} style={{ marginTop: 20 }} block>Download QR Label</Button>
                </div>
            )}
        </Modal>
    </>
);
