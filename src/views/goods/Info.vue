<template>
  <div class="goods-page">

    <!-- ══════════════════════════════════════════════════════════
         列表页：左侧分类树 + 右侧商品表格
    ══════════════════════════════════════════════════════════ -->
    <div v-if="!showForm" class="list-layout">

      <!-- 左侧分类面板 -->
      <div class="cate-panel" :style="{ width: catePanelWidth + 'px' }">
        <!-- 视图切换 tab -->
        <div class="cate-view-tabs">
          <span class="cate-view-tab" :class="{ active: leftView === 'cate' }" @click="switchLeftView('cate')">商品分类</span>
          <span class="cate-view-tab" :class="{ active: leftView === 'bom' }" @click="switchLeftView('bom')">BOM视图</span>
        </div>

        <!-- 商品分类模式 -->
        <template v-if="leftView === 'cate'">
          <div class="cate-header">
            <span class="cate-title">商品分类</span>
            <el-button :icon="Plus" size="small" circle @click="openCateForm()" />
          </div>
          <div class="cate-search">
            <el-input v-model="cateKeyword" placeholder="搜索分类" clearable size="small" />
          </div>
          <div class="cate-tree" v-loading="cateLoading">
            <!-- PC端：树形结构 -->
            <div class="cate-item pc-only" :class="{ active: selectedCateId === null }" @click="selectCate(null)">
              全部
            </div>
            <el-tree
              class="pc-only"
              :data="cateTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              :default-expand-all="false"
              highlight-current
              style="background:transparent"
              @node-click="(node: any) => selectCate(node.id)"
            >
              <template #default="{ data }">
                <span style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:4px;overflow:hidden">
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ data.name }}</span>
                  <span class="cate-item-actions" style="flex-shrink:0">
                    <el-icon class="act-icon" @click.stop="openCateForm(data)"><Edit /></el-icon>
                    <el-icon class="act-icon danger" @click.stop="handleDeleteCate(data.id)"><Delete /></el-icon>
                  </span>
                </span>
              </template>
            </el-tree>
            <div v-if="!cateLoading && cateTree.length === 0" class="cate-empty pc-only">暂无分类</div>
            <!-- 移动端：两行 chip，第一行根分类，第二行子分类 -->
            <div class="mobile-cate-chips">
              <!-- 第一行：全部 + 根节点 -->
              <div class="mobile-chip-row">
                <span class="cate-chip" :class="{ active: selectedCateId === null }" @click="selectCate(null)">全部</span>
                <span
                  v-for="c in cateTree"
                  :key="c.id"
                  class="cate-chip"
                  :class="{ active: selectedCateId === c.id || (c.children && c.children.some((ch: any) => ch.id === selectedCateId)) }"
                  @click="selectCate(c.id)"
                >{{ c.name }}</span>
              </div>
              <!-- 第二行：当前选中根节点的子分类 -->
              <div
                v-if="cateTree.find((c: any) => c.id === selectedCateId)?.children?.length"
                class="mobile-chip-row mobile-chip-sub"
              >
                <span
                  v-for="sub in cateTree.find((c: any) => c.id === selectedCateId)?.children ?? []"
                  :key="(sub as any).id"
                  class="cate-chip cate-chip-sub"
                  :class="{ active: selectedCateId === (sub as any).id }"
                  @click="selectCate((sub as any).id)"
                >{{ (sub as any).name }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- BOM视图模式 -->
        <template v-else>
          <div class="cate-header">
            <span class="cate-title">按成品筛选</span>
          </div>
          <div class="cate-search">
            <el-input v-model="bomViewKeyword" placeholder="搜索成品" clearable size="small" />
          </div>
          <div class="cate-tree" v-loading="bomViewLoading">
            <div class="cate-item" :class="{ active: bomViewGoodsId === null }" @click="selectBomGoods(null)">
              全部商品
            </div>
            <div
              v-for="g in filteredBomGoodsList"
              :key="g.goods_id"
              class="cate-item"
              :class="{ active: bomViewGoodsId === g.goods_id }"
              @click="selectBomGoods(g)"
            >
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ g.goods_name }}</span>
              <span class="goods-count" style="flex-shrink:0;font-size:11px;color:#0071e3;background:rgba(0,113,227,0.08);border-radius:3px;padding:0 4px;margin-left:4px">
                {{ g.material_count }}种
              </span>
            </div>
            <div v-if="!bomViewLoading && filteredBomGoodsList.length === 0" class="cate-empty">暂无BOM成品</div>
          </div>
        </template>
      </div>
      <div class="cate-resize-handle" @mousedown="startCateResize" />

      <!-- 右侧商品列表 -->
      <div class="goods-list-wrap">
        <ScTable ref="tableRef" :api-obj="getGoodsList"
          del-path="/goods/ShopGoods/batchDel"
          export-file-name="商品列表" :params="searchForm" :row-filter="rowFilter"
          :export-columns="{ goods_sn: '商品编码', goods_name: '商品名称', goods_type: '类型', en_name: '英文名称', unit_name: '商品单位', cate_name: '商品分类', cost_price: '采购价', sell_price: '销售价', brand_name: '商品品牌', barcode: '商品条码', status: '状态' }">
          <template #search>
            <el-input
              v-model="searchForm.keyword"
              placeholder="输入关键字进行过滤"
              clearable
              :style="{ width: isMobileList ? '100%' : '200px' }"
            />
            <el-select
              v-model="filterType"
              placeholder="商品类型"
              clearable
              :style="{ width: isMobileList ? '100%' : '120px' }"
              @change="tableRef?.refresh()"
            >
              <el-option label="成品" :value="1" />
              <el-option label="半成品" :value="2" />
              <el-option label="原材料" :value="3" />
              <el-option label="辅料" :value="4" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增</el-button>
            <template v-if="!isMobileList">
              <el-button :icon="Camera" @click="openListScanner">扫码录入</el-button>
              <el-button :icon="Upload" @click="triggerImport">导入</el-button>
              <el-button :icon="Download" @click="downloadTemplate">下载模板</el-button>
            </template>
            <input ref="importFileRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImportFile" />
          </template>
          <template #selection-actions="{ selectedRows, clearSelection, refresh }">
            <el-button
              type="primary"
              size="small"
              :disabled="!cateOptions.length"
              @click="openBatchMoveDialog(selectedRows, clearSelection, refresh)"
            >
              移动
            </el-button>
          </template>

          <!-- 移动端卡片列表 -->
          <template #mobile="{ rows, loading: listLoading }">
            <div v-if="listLoading" style="text-align:center;padding:24px;color:#86909c">加载中...</div>
            <div v-else-if="!rows.length" style="text-align:center;padding:24px;color:#86909c">暂无数据</div>
            <template v-else>
              <div v-for="row in rows" :key="row.id" class="goods-card" @click="openEdit(row)">
                <div class="goods-card-title">
                  <span>{{ row.goods_name }}</span>
                  <el-tag v-if="getGoodsType(row) === 2" type="warning" size="small">半成品</el-tag>
                  <el-tag v-else-if="getGoodsType(row) === 3" type="info" size="small">原材料</el-tag>
                  <el-tag v-else-if="getGoodsType(row) === 4" size="small">辅料</el-tag>
                  <el-tag v-else-if="getGoodsType(row) === 1" type="success" size="small">成品</el-tag>
                  <el-tag v-else type="info" size="small">未指定</el-tag>
                </div>
                <div class="goods-card-row">
                  <span class="goods-card-label">分类</span>
                  <span class="goods-card-value">{{ getCatePathText(row) || '-' }}</span>
                </div>
                <div class="goods-card-row">
                  <span class="goods-card-label">销售价</span>
                  <span class="goods-card-value blue">{{ row.sell_price ?? '-' }}</span>
                </div>
                <div class="goods-card-footer">
                  <span class="goods-card-sn">{{ row.goods_sn || '' }}</span>
                  <div style="display:flex;gap:8px">
                    <el-button type="primary" link size="small" @click.stop="openEdit(row)">编辑</el-button>
                    <el-button type="danger" link size="small" @click.stop="handleDelete(row.id)">删除</el-button>
                  </div>
                </div>
              </div>
            </template>
          </template>
          <el-table-column v-if="!isMobileList" type="index" label="序号" width="60" align="center" />
          <el-table-column v-if="!isMobileList" prop="goods_sn" label="商品编码" min-width="120" />
          <el-table-column prop="goods_name" label="商品名称" :min-width="isMobileList ? 140 : 150" />
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="getGoodsType(row) === 0" type="info" size="small">未指定</el-tag>
              <el-tag v-else-if="getGoodsType(row) === 2" type="warning" size="small">半成品</el-tag>
              <el-tag v-else-if="getGoodsType(row) === 3" type="info" size="small">原材料</el-tag>
              <el-tag v-else-if="getGoodsType(row) === 4" size="small">辅料</el-tag>
              <el-tag v-else type="success" size="small">成品</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="!isMobileList" prop="en_name" label="英文名称" min-width="120" />
          <el-table-column v-if="!isMobileList" prop="unit_name" label="商品单位" width="90" align="center" />
          <el-table-column label="商品分类" :min-width="isMobileList ? 140 : 160">
            <template #default="{ row }">
              {{ getCatePathText(row) }}
            </template>
          </el-table-column>
          <el-table-column v-if="!isMobileList" prop="cost_price" label="采购价" width="90" align="right" />
          <el-table-column prop="sell_price" label="销售价" width="90" align="right" />
          <el-table-column v-if="!isMobileList" prop="brand_name" label="商品品牌" min-width="100" />
          <el-table-column v-if="!isMobileList" prop="barcode" label="商品条码" min-width="120" />
          <el-table-column v-if="!isMobileList" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch :model-value="row.status === 1" disabled size="small" />
            </template>
          </el-table-column>
          <!-- BOM视图：显示用量 -->
          <el-table-column v-if="leftView === 'bom' && bomViewGoodsId !== null" label="用量" width="110" align="center">
            <template #default="{ row }">
              <span v-if="getBomUsage(row)" style="color:#0071e3;font-weight:500">
                {{ getBomUsage(row) }}
              </span>
              <el-tag v-else type="success" size="small">成品</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="相关操作"
            :width="isMobileList ? 120 : 220"
            :fixed="isMobileList ? false : 'right'"
            :align="isMobileList ? 'center' : 'right'"
          >
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="!isMobileList" type="success" link size="small" @click="openView(row)">查看</el-button>
              <el-button v-if="!isMobileList" type="warning" link size="small" @click="openCopy(row)">复制</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         新增/编辑全页面
    ══════════════════════════════════════════════════════════ -->
    <div v-else class="form-page">
      <!-- 顶部导航栏 -->
      <div class="form-topbar">
        <div class="form-tabs-nav">
          <span v-for="tab in tabs" :key="tab.key" class="tab-item"
            :class="{ active: activeTab === tab.key }"
            @click="scrollToSection(tab.key)">{{ tab.label }}</span>
        </div>
        <div class="form-actions">
          <el-button @click="backToList">返回</el-button>
          <template v-if="!isView">
            <el-button type="primary" :loading="saving" @click="handleSave">保存 (Ctrl+S)</el-button>
            <el-button type="success" :loading="saving" @click="handleSaveAndNew">保存并继续新增</el-button>
          </template>
          <el-button v-else type="primary" @click="isView = false">编辑</el-button>
        </div>
      </div>

      <!-- 滚动内容区 -->
      <div class="form-scroll" ref="scrollRef" @scroll="onScroll">
        <el-form ref="formRef" :model="fd" label-width="110px" :disabled="isView">

          <!-- ① 基本信息 -->
          <div class="form-section" ref="secBase" data-sec="base">
            <div class="sec-title">基本信息</div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="商品类型" prop="goods_type">
                  <el-select v-model="fd.goods_type" style="width:100%">
                    <el-option label="成品" :value="1" />
                    <el-option label="半成品" :value="2" />
                    <el-option label="原材料" :value="3" />
                    <el-option label="辅料" :value="4" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品编码" prop="goods_sn">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-input v-model="fd.goods_sn" placeholder="不填写自动生成" style="flex:1" />
                    <el-button @click="fd.goods_sn = genGoodsSn()">自动生成</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品名称" prop="goods_name"
                  :rules="[{ required: true, message: '请输入商品名称' }]">
                  <el-input v-model="fd.goods_name" placeholder="请输入商品名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="英文名称" prop="en_name">
                  <el-input v-model="fd.en_name" placeholder="请输入英文名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品助记码" prop="goods_memo">
                  <el-input v-model="fd.goods_memo" placeholder="商品助记码" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品分类" prop="cate_id"
                  :rules="[{ required: true, message: '请选择商品分类' }]">
                  <div class="row-with-add">
                    <el-tree-select
                      v-model="fd.cate_id"
                      :data="cateTreeSelectData"
                      :props="{ value: 'id', label: 'name', children: 'children' }"
                      check-strictly
                      clearable
                      filterable
                      placeholder="请选择商品分类"
                      style="flex:1"
                      @change="onCateChange"
                    />
                    <el-button :icon="Plus" @click="quickAdd('cate')" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品规格" prop="spec">
                  <el-input v-model="fd.spec" placeholder="如：500g、1L、XL" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="品牌" prop="brand_id">
                  <div class="row-with-add">
                    <el-select v-model="fd.brand_id" placeholder="请选择" clearable style="flex:1" @change="onBrandChange">
                      <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
                    </el-select>
                    <el-button :icon="Plus" @click="quickAdd('brand')" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="安全库存上限" prop="safe_max">
                  <el-input-number v-model="fd.safe_max" :min="0" controls-position="right" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="安全库存下限" prop="safe_min">
                  <el-input-number v-model="fd.safe_min" :min="0" controls-position="right" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="制造工时" prop="make_time">
                  <el-input v-model.number="fd.make_time" placeholder="0">
                    <template #append>秒</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="排序" prop="sort">
                  <el-input-number v-model="fd.sort" :min="0" controls-position="right" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-switch v-model="fd.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="6">
                <el-form-item label="可销售">
                  <div>
                    <el-radio-group v-model="fd.can_sale">
                      <el-radio-button :value="1">可以</el-radio-button>
                      <el-radio-button :value="0">不可以</el-radio-button>
                    </el-radio-group>
                    <div class="field-hint">设置在销售模块中是否可选择到此商品</div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="可采购">
                  <div>
                    <el-radio-group v-model="fd.can_buy">
                      <el-radio-button :value="1">可以</el-radio-button>
                      <el-radio-button :value="0">不可以</el-radio-button>
                    </el-radio-group>
                    <div class="field-hint">设置在采购模块中是否可选择到此商品</div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="可自制">
                  <div>
                    <el-radio-group v-model="fd.can_make">
                      <el-radio-button :value="1">可以</el-radio-button>
                      <el-radio-button :value="0">不可以</el-radio-button>
                    </el-radio-group>
                    <div class="field-hint">设置是否可用于创建自制加工任务</div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="可委外">
                  <div>
                    <el-radio-group v-model="fd.can_outsource">
                      <el-radio-button :value="1">可以</el-radio-button>
                      <el-radio-button :value="0">不可以</el-radio-button>
                    </el-radio-group>
                    <div class="field-hint">设置是否可用于创建委外加工任务</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- ② 计量单位 -->
          <div class="form-section" ref="secUnit" data-sec="unit">
            <div class="sec-title-row">
              <div style="display:flex;align-items:center;gap:12px">
                <span class="sec-title-text">计量单位</span>
                <el-checkbox v-model="fd.multi_unit" @change="onMultiUnitChange">
                  <span :style="fd.multi_unit ? 'color:#0071e3;font-weight:500' : ''">启用多单位</span>
                </el-checkbox>
              </div>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="商品单位" prop="unit_id"
                  :rules="[{ required: true, message: '请选择单位' }]">
                  <div class="row-with-add">
                    <el-select v-model="fd.unit_id" placeholder="请选择单位" style="flex:1" @change="onUnitChange">
                      <el-option v-for="u in unitOptions" :key="u.id" :label="u.name" :value="u.id" />
                    </el-select>
                    <el-button :icon="Plus" @click="quickAdd('unit')" />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 多单位表格 -->
            <div v-if="fd.multi_unit" style="margin-top:4px">
              <!-- 基础单位说明行 -->
              <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f0f9ff;border:1px solid #bae0ff;border-radius:6px;margin-bottom:8px;font-size:13px">
                <el-tag type="primary" size="small">基础单位</el-tag>
                <span style="font-weight:600;color:#0071e3">{{ fd.unit_name || '—' }}</span>
                <span style="color:rgba(29,29,31,0.35)">（换算基准：1 {{ fd.unit_name || '单位' }} = 1）</span>
                <span v-if="fd.cost_price" style="margin-left:8px;color:#52c41a">采购价：¥{{ Number(fd.cost_price).toFixed(2) }}</span>
                <span v-if="fd.sell_price" style="margin-left:8px;color:#0071e3">销售价：¥{{ Number(fd.sell_price).toFixed(2) }}</span>
              </div>
              <!-- 辅助单位表格 -->
              <el-table :data="auxUnitRows" border size="small" style="width:100%">
                <el-table-column type="index" label="序号" width="55" align="center" />
                <el-table-column label="辅助单位" min-width="130">
                  <template #default="{ row, $index }">
                    <el-select v-if="!isView" v-model="row.unit_name" placeholder="请选择单位" size="small" style="width:100%"
                      @change="(v:any) => onMultiUnitSelect(v, $index + 1)">
                      <el-option v-for="u in auxUnitSelectOptions" :key="u" :label="u" :value="u" />
                    </el-select>
                    <span v-else>{{ row.unit_name || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="换算关系" min-width="200" align="center">
                  <template #default="{ row }">
                    <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:13px">
                      <span>1 {{ row.unit_name || '辅助单位' }}</span>
                      <span>=</span>
                      <el-input-number v-if="!isView" v-model="row.ratio" :min="0.0001" :precision="4" :controls="false"
                        size="small" style="width:80px" @change="onMultiUnitRatioChange(row)" />
                      <span v-else>{{ row.ratio }}</span>
                      <span style="color:#0071e3;font-weight:500">{{ fd.unit_name || '基础单位' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="采购价" width="130" align="center">
                  <template #default="{ row }">
                    <el-input-number v-if="!isView" v-model="row.cost_price" :min="0" :precision="2" :controls="false"
                      size="small" style="width:100px" placeholder="自动核算" />
                    <span v-else>¥{{ (row.cost_price ?? 0).toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="销售价" width="130" align="center">
                  <template #default="{ row }">
                    <el-input-number v-if="!isView" v-model="row.sell_price" :min="0" :precision="2" :controls="false"
                      size="small" style="width:100px" placeholder="自动核算" />
                    <span v-else>¥{{ (row.sell_price ?? 0).toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="最小销售单位" width="120" align="center">
                  <template #default="{ row, $index }">
                    <el-radio v-model="minSaleUnitIdx" :value="$index + 1" :disabled="isView" size="small">{{ '' }}</el-radio>
                  </template>
                </el-table-column>
                <el-table-column label="默认销售单位" width="120" align="center">
                  <template #default="{ row, $index }">
                    <el-radio v-model="defaultSaleUnitIdx" :value="$index + 1" :disabled="isView" size="small">{{ '' }}</el-radio>
                  </template>
                </el-table-column>
                <el-table-column v-if="!isView" label="操作" width="70" align="center">
                  <template #default="{ row, $index }">
                    <el-button type="danger" link size="small" @click="removeMultiUnitRow($index + 1)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="auxUnitRows.length === 0 && !isView" style="text-align:center;color:rgba(29,29,31,0.35);font-size:13px;padding:12px 0">
                暂无辅助单位，点击下方添加
              </div>
              <el-button v-if="!isView" size="small" :icon="Plus" style="margin-top:8px" @click="addMultiUnitRow">添加辅助单位</el-button>
            </div>
          </div>

          <!-- ③ 规格设置 -->
          <div class="form-section" ref="secSpec" data-sec="spec">
            <div class="sec-title-row">
              <div style="display:flex;align-items:center;gap:12px">
                <span class="sec-title-text">规格设置</span>
                <el-checkbox v-model="fd.multi_spec" @change="onMultiSpecChange">
                  <span :style="fd.multi_spec ? 'color:#0071e3;font-weight:500' : ''">启用多规格</span>
                </el-checkbox>
              </div>
              <el-button v-if="fd.multi_spec && !isView" size="small" type="primary" @click="addSpecAttr">+ 添加规格属性</el-button>
            </div>

            <!-- 单规格模式 -->
            <div v-if="!fd.multi_spec" style="color:rgba(29,29,31,0.35);font-size:13px;padding:12px 0">
              未启用多规格，该商品只有一种规格。如需设置颜色、尺寸等多种规格，请勾选"启用多规格"。
            </div>

            <!-- 多规格模式 -->
            <div v-else class="spec-editor">
              <!-- 规格属性行 -->
              <div v-for="(attr, aIdx) in specAttrs" :key="aIdx" class="spec-attr-row">
                <div class="spec-attr-header">
                  <div class="spec-attr-name-wrap">
                    <span class="spec-attr-label">规格名称：</span>
                    <el-input
                      v-model="attr.name"
                      :disabled="isView"
                      placeholder="如：颜色、尺寸、材质"
                      style="width:160px"
                      size="small"
                    />
                  </div>
                  <el-button v-if="!isView" type="danger" link size="small" @click="removeSpecAttr(aIdx)">删除该规格</el-button>
                </div>
                <div class="spec-attr-values">
                  <span class="spec-attr-label">规格值：</span>
                  <div class="spec-tags-wrap">
                    <el-tag
                      v-for="(val, vIdx) in attr.values"
                      :key="vIdx"
                      :closable="!isView"
                      size="small"
                      style="margin:2px 4px 2px 0"
                      @close="removeSpecValue(aIdx, vIdx)"
                    >{{ val }}</el-tag>
                    <template v-if="!isView">
                      <el-input
                        v-if="attr._inputVisible"
                        :ref="el => { if (el) attr._inputRef = el }"
                        v-model="attr._inputVal"
                        size="small"
                        style="width:100px"
                        @keyup.enter="confirmAddValue(aIdx)"
                        @blur="confirmAddValue(aIdx)"
                      />
                      <el-button v-else size="small" @click="showValueInput(aIdx)">+ 添加值</el-button>
                    </template>
                  </div>
                </div>
              </div>

              <div v-if="specAttrs.length === 0" style="color:rgba(29,29,31,0.35);font-size:13px;padding:8px 0">
                点击右上角"添加规格属性"开始设置规格，如：颜色（红/蓝/绿）、尺寸（S/M/L/XL）
              </div>

              <!-- SKU 组合表格 -->
              <div v-if="skuList.length > 0" style="margin-top:16px">
                <div style="font-size:13px;font-weight:600;color:#1d1d1f;margin-bottom:8px">
                  SKU 明细（共 {{ skuList.length }} 种组合）
                </div>
                <el-table :data="skuList" border size="small" style="width:100%">
                  <el-table-column
                    v-for="(attr, idx) in specAttrs"
                    :key="idx"
                    :label="attr.name || `规格${idx+1}`"
                    :prop="`vals[${idx}]`"
                    min-width="90"
                    align="center"
                  >
                    <template #default="{ row }">{{ row.vals[idx] }}</template>
                  </el-table-column>
                  <el-table-column label="SKU编码" min-width="140">
                    <template #default="{ row }">
                      <el-input v-if="!isView" v-model="row.sku_sn" size="small" placeholder="选填" />
                      <span v-else>{{ row.sku_sn || '—' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="销售价" width="110">
                    <template #default="{ row }">
                      <el-input-number v-if="!isView" v-model="row.sell_price" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" />
                      <span v-else>¥{{ row.sell_price?.toFixed(2) ?? '0.00' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="成本价" width="110">
                    <template #default="{ row }">
                      <el-input-number v-if="!isView" v-model="row.cost_price" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" />
                      <span v-else>¥{{ row.cost_price?.toFixed(2) ?? '0.00' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="库存" width="90">
                    <template #default="{ row }">
                      <el-input-number v-if="!isView" v-model="row.stock" :min="0" :precision="0" controls-position="right" size="small" style="width:100%" />
                      <span v-else>{{ row.stock ?? 0 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="条形码" min-width="130">
                    <template #default="{ row }">
                      <el-input v-if="!isView" v-model="row.barcode" size="small" placeholder="选填" />
                      <span v-else>{{ row.barcode || '—' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                <div style="margin-top:8px;display:flex;gap:8px" v-if="!isView">
                  <el-button size="small" type="primary" @click="batchFillSkuPrice">批量填写价格</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- ④ 价格&条码 -->
          <div class="form-section" ref="secPrice" data-sec="price">
            <div class="sec-title">价格&条码</div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="销售价" prop="sell_price">
                  <el-input-number v-model="fd.sell_price" :min="0" :precision="2" controls-position="right" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="成本价" prop="cost_price">
                  <div style="display:flex;gap:6px;width:100%;align-items:center">
                    <el-input-number v-model="fd.cost_price" :min="0" :precision="2" controls-position="right" style="flex:1" />
                    <el-button
                      v-if="fd.id"
                      size="small"
                      :disabled="false"
                      :loading="bomCostLoading"
                      @click="calcCostFromBom"
                    >从BOM核算</el-button>
                  </div>
                  <div v-if="bomCostDetail" style="font-size:11px;color:rgba(29,29,31,0.35);margin-top:4px;line-height:1.6">
                    {{ bomCostDetail }}
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="条形码" prop="barcode">
                  <el-input v-model="fd.barcode" placeholder="请输入条形码" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- ⑤ 备注信息 -->
          <div class="form-section" ref="secRemark" data-sec="remark">
            <div class="sec-title">备注信息</div>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="fd.remark" type="textarea" :rows="4" placeholder="请输入备注" />
            </el-form-item>
          </div>

          <!-- ⑥ 品牌中心 -->
          <div class="form-section brand-center-section" ref="secBrand" data-sec="brand">
            <div class="sec-title">
              品牌中心
              <span class="brand-sec-badge">独立存储 · 不上传至ERP服务器</span>
            </div>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="批发价 (¥)">
                  <el-input-number v-model="brandFd.wholesalePrice" :min="0" :precision="2" controls-position="right" style="width:100%" placeholder="批发价格" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="起订量 (件)">
                  <el-input-number v-model="brandFd.minOrderQuantity" :min="1" :precision="0" controls-position="right" style="width:100%" placeholder="最低起订数量" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="分类标签">
                  <div class="brand-tag-row">
                    <label
                      v-for="opt in TAG_OPTIONS"
                      :key="opt.value"
                      class="brand-tag-check"
                      :class="{ active: brandFd.tags.includes(opt.value) }"
                      @click="!isView && toggleBrandTag(opt.value)"
                    >{{ opt.label }}</label>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="主图 URL">
                  <el-input v-model="brandFd.image" placeholder="https://... 主展示图（建议 800×600）" />
                  <img v-if="brandFd.image" :src="brandFd.image" class="brand-img-preview" referrerpolicy="no-referrer" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="轮播图">
                  <div class="brand-carousel-grid">
                    <div v-for="(_, idx) in brandFd.headerImages" :key="idx" class="brand-carousel-item">
                      <el-input v-model="brandFd.headerImages[idx]" :placeholder="`轮播图 ${idx + 1} URL`" size="small" />
                      <img v-if="brandFd.headerImages[idx]" :src="brandFd.headerImages[idx]" class="brand-img-preview-sm" referrerpolicy="no-referrer" />
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="详情图 URL">
                  <el-input v-model="brandFd.detailImage" placeholder="https://... 长图详情（建议宽 1200px）" />
                  <img v-if="brandFd.detailImage" :src="brandFd.detailImage" class="brand-img-preview" referrerpolicy="no-referrer" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="brand-save-hint" v-if="fd.id">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              品牌中心数据保存在此设备本地，点击顶部「保存」后生效。
            </div>
            <div class="brand-save-hint warn" v-else>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              请先保存商品基本信息，再填写品牌中心字段。
            </div>
          </div>

        </el-form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         分类新增/编辑弹框
    ══════════════════════════════════════════════════════════ -->
    <el-dialog v-model="cateFormVisible" :title="cateFormTitle" width="400px" append-to-body>
      <el-form :model="cateForm" label-width="90px">
        <el-form-item label="分类名称" :rules="[{ required: true }]">
          <el-input v-model="cateForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="上级分类">
          <el-select v-model="cateForm.parent_id" placeholder="请选择（可选）" clearable style="width:100%">
            <el-option v-for="c in cateTree" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="cateForm.sort" :min="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cateFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="cateSaving" @click="handleSaveCate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchMoveDialogVisible" title="批量移动商品分类" width="420px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="已选商品">
          <div>{{ batchMoveRows.length }} 个</div>
        </el-form-item>
        <el-form-item label="目标分类" required>
          <el-tree-select
            v-model="batchMoveCateId"
            :data="allCateTreeSelectData"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            check-strictly
            clearable
            filterable
            placeholder="请选择目标分类"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeBatchMoveDialog">取消</el-button>
        <el-button type="primary" :loading="batchMoveLoading" @click="confirmBatchMove">确定移动</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增（品牌/单位） -->
    <el-dialog v-model="quickDialogVisible" :title="quickDialogTitle" width="360px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="quickName" :placeholder="`请输入名称`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuick">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量填写价格对话框 -->
    <el-dialog v-model="batchPriceVisible" title="批量填写SKU价格" width="360px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="销售价">
          <el-input-number v-model="batchSellPrice" :min="0" :precision="2" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="成本价">
          <el-input-number v-model="batchCostPrice" :min="0" :precision="2" controls-position="right" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchPriceVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchPrice">确定填写</el-button>
      </template>
    </el-dialog>

    <!-- 商品导入预览弹框 -->
    <el-dialog v-model="importDialogVisible" title="导入商品预览" width="85%" append-to-body destroy-on-close>
      <div style="margin-bottom:12px;font-size:13px;color:#86909c">
        共 {{ importRows.length }} 条数据，请确认后点击确认导入。
        <span v-if="importRows.length > 20">（下方仅预览前20条，实际导入全部）</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div style="font-size:13px;color:#606266">
          缺少商品类型的行：<b>{{ importRows.filter(row => row._missingGoodsType).length }}</b>
        </div>
      </div>
      <el-table :data="importRows.slice(0, 20)" border size="small" max-height="400">
        <el-table-column prop="goods_name" label="商品名称" min-width="130" />
        <el-table-column prop="goods_sn" label="商品编码" min-width="120" />
        <el-table-column prop="goods_type_text" label="商品类型" width="90" />
        <el-table-column prop="cate_name" label="商品分类" min-width="120" />
        <el-table-column prop="en_name" label="英文名称" min-width="120" />
        <el-table-column prop="barcode" label="条码" min-width="120" />
        <el-table-column prop="sell_price" label="销售价" width="80" align="right" />
        <el-table-column prop="cost_price" label="采购价" width="80" align="right" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row._errorText || '校验通过'" placement="top">
              <el-tag :type="row._error ? 'danger' : 'success'" size="small">
                {{ row._error ? '异常' : '正常' }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="confirmImport">确认导入 ({{ importRows.length }} 条)</el-button>
      </template>
    </el-dialog>

    <!-- 扫码录入对话框 -->
    <el-dialog v-model="listScannerVisible" title="扫码录入商品" width="min(420px, 95vw)" append-to-body destroy-on-close :close-on-click-modal="false" @closed="stopListScanner">
      <div style="text-align:center">
        <video ref="listVideoRef" style="width:100%;max-height:60vh;background:#000;border-radius:8px;display:block" autoplay muted playsinline />
        <div v-if="listScanError" style="color:#f56c6c;margin-top:8px;font-size:13px">{{ listScanError }}</div>
        <div v-else-if="listScanLooking" style="color:#e6a23c;margin-top:8px;font-size:13px">正在查询条码信息...</div>
        <div v-else-if="!listScanning" style="color:#909399;margin-top:8px;font-size:13px">正在启动摄像头...</div>
        <div v-else style="color:#409eff;margin-top:8px;font-size:13px">对准商品条形码，识别后自动打开录入页面...</div>
      </div>
      <template #footer>
        <el-button @click="listScannerVisible = false">取消</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Edit, Delete, ArrowRight, Upload, Download, Camera } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { ElMessageBox, ElMessage } from 'element-plus'
import { BrowserMultiFormatReader } from '@zxing/browser'
import ScTable from '@/components/ScTable.vue'
import http from '@/api/http'
import {
  getGoodsList, createGoods, updateGoods, deleteGoods,
  getGoodsCateList, createGoodsCate, updateGoodsCate, deleteGoodsCate,
  getBrandList, createBrand,
  getUnitList, createUnit,
  getSpecList, createSpec, deleteSpec,
  getBomByGoods, getBomList,
  getUnitConvert, saveUnitConvert,
} from '@/api/goods'
import { getStockList } from '@/api/warehouse'

// ── 分类面板 ─────────────────────────────────────────────────────────────────
const cateOptions = ref<any[]>([])
const cateLoading = ref(false)
const cateKeyword = ref('')
const CATE_PANEL_MIN = 160
const CATE_PANEL_MAX = 400
const catePanelWidth = ref(Number(localStorage.getItem('goods_cate_panel_w') || 200))

function startCateResize(e: MouseEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startW = catePanelWidth.value
  function onMove(ev: MouseEvent) {
    catePanelWidth.value = Math.min(CATE_PANEL_MAX, Math.max(CATE_PANEL_MIN, startW + ev.clientX - startX))
  }
  function onUp() {
    localStorage.setItem('goods_cate_panel_w', String(catePanelWidth.value))
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
const selectedCateId = ref<number | null>(null)
const collapsedCates = ref<Set<number>>(new Set())

function toggleCate(id: number) {
  if (collapsedCates.value.has(id)) collapsedCates.value.delete(id)
  else collapsedCates.value.add(id)
}

interface CateTreeNode { id: number; name: string; sort: number; parent_id: any; children: CateTreeNode[] }

function buildCateTree(source: any[]) {
  const all: CateTreeNode[] = source.map(c => ({ ...c, children: [] }))
  const map: Record<number, CateTreeNode> = {}
  all.forEach(c => { map[c.id] = c })
  const roots: CateTreeNode[] = []
  all.forEach(c => {
    const pid = Number(c.parent_id ?? 0)
    if (pid && map[pid]) map[pid].children.push(c)
    else roots.push(c)
  })
  return roots
}

const cateTree = computed<CateTreeNode[]>(() => {
  const keyword = cateKeyword.value
  // 搜索模式：扁平展示匹配项
  if (keyword) return cateOptions.value.filter(c => c.name.includes(keyword)).map(c => ({ ...c, children: [] }))
  // 树形模式
  return buildCateTree(cateOptions.value)
})

const filteredCates = computed(() => {
  if (!cateKeyword.value) return cateOptions.value
  return cateOptions.value.filter(c => c.name.includes(cateKeyword.value))
})

// el-tree-select data (same as cateTree but el-tree-select needs the full tree structure)
const cateTreeSelectData = computed(() => cateTree.value)
const allCateTreeSelectData = computed(() => buildCateTree(cateOptions.value))

async function loadCates() {
  cateLoading.value = true
  try {
    const res = await getGoodsCateList({ list_rows: 200 })
    const rows = res.data?.rows ?? []
    cateOptions.value = rows.sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
  } finally {
    cateLoading.value = false
  }
}

function selectCate(id: number | null) {
  selectedCateId.value = id
  // Find all descendant IDs of the selected cate
  if (id === null) {
    searchForm.cate_id = ''
  } else {
    const children = cateOptions.value.filter(c => c.parent_id === id)
    if (children.length > 0) {
      // Parent category: don't filter by cate_id in API (get all), use rowFilter instead
      searchForm.cate_id = ''
    } else {
      // Leaf category: filter directly by cate_id
      searchForm.cate_id = id
    }
  }
  tableRef.value?.refresh()
}

// 分类新增/编辑
const cateFormVisible = ref(false)
const cateFormTitle = ref('新增分类')
const cateSaving = ref(false)
const cateForm = reactive({ id: 0, name: '', parent_id: null as any, sort: 0 })

function openCateForm(row?: any) {
  if (row) {
    Object.assign(cateForm, { id: row.id, name: row.name, parent_id: row.parent_id ?? null, sort: row.sort ?? 0 })
    cateFormTitle.value = '编辑分类'
  } else {
    Object.assign(cateForm, { id: 0, name: '', parent_id: null, sort: 0 })
    cateFormTitle.value = '新增分类'
  }
  cateFormVisible.value = true
}

async function handleSaveCate() {
  if (!cateForm.name.trim()) { ElMessage.warning('请输入分类名称'); return }
  // 同级重名校验
  const sameLevelDup = cateOptions.value.find(c =>
    c.name.trim() === cateForm.name.trim() &&
    String(c.parent_id ?? '0') === String(cateForm.parent_id ?? '0') &&
    c.id !== cateForm.id
  )
  if (sameLevelDup) { ElMessage.warning(`同级分类下已存在"${cateForm.name}"，请使用其他名称`); return }
  cateSaving.value = true
  try {
    cateForm.id ? await updateGoodsCate(cateForm) : await createGoodsCate(cateForm)
    ElMessage.success('操作成功')
    cateFormVisible.value = false
    await loadCates()
  } finally {
    cateSaving.value = false
  }
}

async function handleDeleteCate(id: number) {
  await ElMessageBox.confirm('确定删除该分类？', '提示', { type: 'warning' })
  await deleteGoodsCate(id)
  ElMessage.success('删除成功')
  if (selectedCateId.value === id) selectCate(null)
  await loadCates()
}

// ── 商品列表 ─────────────────────────────────────────────────────────────────
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ keyword: '', cate_id: '' })
const filterType = ref<number | ''>('')
const showForm = ref(false)
const isView = ref(false)
const isMobileList = ref(window.innerWidth < 768)
const batchMoveDialogVisible = ref(false)
const batchMoveLoading = ref(false)
const batchMoveCateId = ref<number | null>(null)
const batchMoveRows = ref<any[]>([])
const batchMoveAfterAction = ref<{ clearSelection?: () => void; refresh?: () => void }>({})

function handleMobileResize() {
  isMobileList.value = window.innerWidth < 768
}

// 商品类型本地存储（后端无此字段）
const GOODS_TYPE_KEY = 'erp_goods_type_map'
function loadGoodsTypeMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOODS_TYPE_KEY) || '{}') } catch { return {} }
}
function saveGoodsTypeMap(map: Record<number, number>) {
  localStorage.setItem(GOODS_TYPE_KEY, JSON.stringify(map))
}
const goodsTypeMap = ref<Record<number, number>>(loadGoodsTypeMap())

function getGoodsType(row: any): number {
  if (Number(row.goods_type ?? 0)) return Number(row.goods_type)
  if (Object.prototype.hasOwnProperty.call(goodsTypeMap.value, row.id)) return Number(goodsTypeMap.value[row.id] ?? 0)
  return 0
}

function getCatePathText(row: any) {
  const cateId = Number(row?.cate_id ?? 0)
  if (!cateId) return row?.cate_name || '—'

  const map = new Map(cateOptions.value.map((item: any) => [Number(item.id), item]))
  const names: string[] = []
  const seen = new Set<number>()
  let current = map.get(cateId)

  while (current && !seen.has(Number(current.id))) {
    names.unshift(current.name)
    seen.add(Number(current.id))
    const parentId = Number(current.parent_id ?? 0)
    current = parentId ? map.get(parentId) : null
  }

  return names.length ? names.join('/') : (row?.cate_name || '—')
}

// Cate IDs to show when a parent category is selected (parent + all children)
// ── BOM 视图 ──────────────────────────────────────────────────────────────────
const leftView = ref<'cate' | 'bom'>('cate')
const bomViewLoading = ref(false)
const bomViewKeyword = ref('')
// { goods_id, goods_name, goods_sn, material_count, materialIds: Set<number> }
const bomGoodsList = ref<any[]>([])
// 当前选中的成品（null = 全部）
const bomViewGoodsId = ref<number | null>(null)
// materialIds of selected BOM product + the product itself
const bomViewMaterialIds = ref<Set<number>>(new Set())
// map: goods_id -> BOM rows (for usage display)
const bomUsageMap = ref<Map<number, any>>(new Map())

const filteredBomGoodsList = computed(() => {
  if (!bomViewKeyword.value) return bomGoodsList.value
  return bomGoodsList.value.filter(g =>
    g.goods_name?.includes(bomViewKeyword.value) || g.goods_sn?.includes(bomViewKeyword.value)
  )
})

async function loadBomView() {
  bomViewLoading.value = true
  try {
    const res = await getBomList({ list_rows: 2000 })
    const rows: any[] = res.data?.rows ?? []
    // 聚合成品
    const goodsMap = new Map<number, any>()
    for (const r of rows) {
      if (!r.goods_id) continue
      if (!goodsMap.has(r.goods_id)) {
        goodsMap.set(r.goods_id, {
          goods_id: r.goods_id,
          goods_name: r.goods_name,
          goods_sn: r.goods_sn,
          material_count: 0,
          materialIds: new Set<number>(),
          bomRows: [] as any[],
        })
      }
      const g = goodsMap.get(r.goods_id)!
      if (r.material_name && r.material_name !== '（待添加物料）' && r.num > 0) {
        g.material_count++
        if (r.material_id) g.materialIds.add(r.material_id)
        g.bomRows.push(r)
      }
    }
    bomGoodsList.value = Array.from(goodsMap.values())
    // 重建 usageMap
    const newUsageMap = new Map<number, any>()
    for (const g of bomGoodsList.value) {
      for (const r of g.bomRows) {
        if (r.material_id) newUsageMap.set(r.material_id, r)
      }
    }
    bomUsageMap.value = newUsageMap
  } finally {
    bomViewLoading.value = false
  }
}

function selectBomGoods(g: any | null) {
  if (g === null) {
    bomViewGoodsId.value = null
    bomViewMaterialIds.value = new Set()
  } else {
    bomViewGoodsId.value = g.goods_id
    // 包含成品本身 + 所有物料
    bomViewMaterialIds.value = new Set([g.goods_id, ...g.materialIds])
    // 只为当前成品重建 usageMap（物料id -> bom行）
    const m = new Map<number, any>()
    for (const r of g.bomRows) {
      if (r.material_id) m.set(r.material_id, r)
    }
    bomUsageMap.value = m
  }
  tableRef.value?.refresh()
}

function switchLeftView(view: 'cate' | 'bom') {
  leftView.value = view
  if (view === 'bom') {
    // 重置分类筛选，切换到 BOM 模式
    selectedCateId.value = null
    searchForm.cate_id = ''
    bomViewGoodsId.value = null
    bomViewMaterialIds.value = new Set()
    loadBomView()
  } else {
    // 切回分类模式，重置 BOM 筛选
    bomViewGoodsId.value = null
    bomViewMaterialIds.value = new Set()
  }
  tableRef.value?.refresh()
}

function getBomUsage(row: any): string {
  const r = bomUsageMap.value.get(row.id)
  if (!r) return ''
  return `${r.num} ${r.unit_name || ''}`
}

const activeCateIds = computed<Set<number> | null>(() => {
  const id = selectedCateId.value
  if (id === null) return null
  const children = cateOptions.value.filter(c => c.parent_id === id)
  if (children.length === 0) return null  // leaf: handled by API param
  const ids = new Set<number>([id, ...children.map(c => c.id)])
  return ids
})

const rowFilter = computed(() => {
  const typeFilter = filterType.value ? (row: any) => getGoodsType(row) === filterType.value : null
  const cateFilter = activeCateIds.value ? (row: any) => activeCateIds.value!.has(row.cate_id) : null
  // BOM视图：按物料ID集合筛选
  const bomIds = leftView.value === 'bom' && bomViewGoodsId.value !== null ? bomViewMaterialIds.value : null
  const bomFilter = bomIds ? (row: any) => bomIds.has(row.id) : null
  if (!typeFilter && !cateFilter && !bomFilter) return undefined
  return (row: any) => {
    if (typeFilter && !typeFilter(row)) return false
    if (cateFilter && !cateFilter(row)) return false
    if (bomFilter && !bomFilter(row)) return false
    return true
  }
})

function openBatchMoveDialog(rows: any[], clearSelection?: () => void, refresh?: () => void) {
  if (!rows.length) {
    ElMessage.warning('请先勾选要移动的商品')
    return
  }
  if (!cateOptions.value.length) {
    ElMessage.warning('请先创建商品分类')
    return
  }
  batchMoveRows.value = [...rows]
  batchMoveCateId.value = null
  batchMoveAfterAction.value = { clearSelection, refresh }
  batchMoveDialogVisible.value = true
}

function closeBatchMoveDialog() {
  batchMoveDialogVisible.value = false
  batchMoveCateId.value = null
  batchMoveRows.value = []
  batchMoveAfterAction.value = {}
}

async function confirmBatchMove() {
  const targetCateId = Number(batchMoveCateId.value || 0)
  if (!targetCateId) {
    ElMessage.warning('请选择目标分类')
    return
  }

  const targetCate = cateOptions.value.find(item => Number(item.id) === targetCateId)
  if (!targetCate) {
    ElMessage.warning('目标分类不存在，请重新选择')
    return
  }

  const rowsToMove = batchMoveRows.value.filter(row => Number(row.cate_id ?? 0) !== targetCateId)
  if (!rowsToMove.length) {
    ElMessage.warning('所选商品已经在该分类下')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定将 ${rowsToMove.length} 个商品移动到“${targetCate.name}”吗？`,
      '批量移动商品分类',
      { type: 'warning', confirmButtonText: '确定移动', cancelButtonText: '取消' },
    )
  } catch {
    return
  }

  batchMoveLoading.value = true
  let success = 0
  let failed = 0
  try {
    for (const row of rowsToMove) {
      try {
        await updateGoods({ id: row.id, cate_id: targetCate.id, cate_name: targetCate.name })
        success++
      } catch {
        failed++
      }
    }

    if (success > 0) {
      batchMoveAfterAction.value.clearSelection?.()
      batchMoveAfterAction.value.refresh?.()
      await loadCates()
    }

    if (success > 0) ElMessage.success(`移动完成：成功 ${success} 条${failed > 0 ? `，失败 ${failed} 条` : ''}`)
    else ElMessage.error('移动失败，请重试')
    closeBatchMoveDialog()
  } finally {
    batchMoveLoading.value = false
  }
}

// ── 品牌/单位选项 ─────────────────────────────────────────────────────────────
const brandOptions = ref<any[]>([])
const unitOptions = ref<any[]>([])
let unitOptionsReady: Promise<void> | null = null

async function loadOptions() {
  unitOptionsReady = (async () => {
    const [b, u] = await Promise.all([
      getBrandList({ list_rows: 200 }),
      getUnitList({ list_rows: 200 }),
    ])
    brandOptions.value = b.data?.rows ?? []
    unitOptions.value = u.data?.rows ?? []
  })()
  await unitOptionsReady
}

onMounted(() => {
  loadCates()
  loadOptions()
  window.addEventListener('resize', handleMobileResize)
})
onUnmounted(() => window.removeEventListener('resize', handleMobileResize))

// ── 表单数据 ─────────────────────────────────────────────────────────────────
const defaultFd = () => ({
  id: 0,
  goods_sn: '', goods_name: '', en_name: '', goods_memo: '',
  goods_type: 1,
  spec: '',
  cate_id: null as any, cate_name: '',
  brand_id: null as any, brand_name: '',
  unit_id: null as any, unit_name: '',
  multi_unit: false, multi_spec: false,
  barcode: '',
  sell_price: 0, cost_price: 0,
  safe_min: 0, safe_max: 0,
  sort: 0, make_time: 0,
  can_sale: 1, can_buy: 1, can_make: 1, can_outsource: 1,
  status: 1, remark: '',
})
const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)

function openCreate() {
  Object.assign(fd, defaultFd())
  Object.assign(brandFd, defaultBrandFd())
  brandFd.headerImages = ['', '', '', '']
  specList.value = []
  multiUnitRows.value = []
  minSaleUnitIdx.value = 0
  defaultSaleUnitIdx.value = 0
  showForm.value = true
  activeTab.value = 'base'
  nextTick(() => scrollRef.value?.scrollTo({ top: 0 }))
}

function genGoodsSn(): string {
  const now = new Date()
  const y = now.getFullYear().toString().slice(2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `SP${y}${m}${d}${rand}`
}

function openEdit(row: any) {
  isView.value = false
  Object.assign(fd, defaultFd(), row, {
    goods_type: getGoodsType(row),
    multi_unit: !!(row.multi_unit),
    multi_spec: !!(row.multi_spec),
    sell_price: Number(row.sell_price) || 0,
    cost_price: Number(row.cost_price) || 0,
    safe_min: Number(row.safe_min) || 0,
    safe_max: Number(row.safe_max) || 0,
    sort: Number(row.sort) || 0,
  })
  showForm.value = true
  activeTab.value = 'base'
  nextTick(() => { scrollRef.value?.scrollTo({ top: 0 }); loadSpecs() })
  if (row.id) loadBrandFd(row.id)
}

function openView(row: any) {
  isView.value = true
  Object.assign(fd, defaultFd(), row, {
    goods_type: getGoodsType(row),
    multi_unit: !!(row.multi_unit),
    multi_spec: !!(row.multi_spec),
    sell_price: Number(row.sell_price) || 0,
    cost_price: Number(row.cost_price) || 0,
    safe_min: Number(row.safe_min) || 0,
    safe_max: Number(row.safe_max) || 0,
    sort: Number(row.sort) || 0,
  })
  showForm.value = true
  activeTab.value = 'base'
  nextTick(() => { scrollRef.value?.scrollTo({ top: 0 }); loadSpecs() })
  if (row.id) loadBrandFd(row.id)
}

function openCopy(row: any) {
  isView.value = false
  Object.assign(fd, defaultFd(), row, {
    id: 0, goods_sn: '',
    multi_unit: !!(row.multi_unit),
    multi_spec: !!(row.multi_spec),
  })
  showForm.value = true
  activeTab.value = 'base'
  nextTick(() => { scrollRef.value?.scrollTo({ top: 0 }); loadSpecs() })
}

function backToList() {
  showForm.value = false
  isView.value = false
  tableRef.value?.refresh()
}

// ── BOM核算成本 ───────────────────────────────────────────────────────────────
const bomCostLoading = ref(false)
const bomCostDetail = ref('')

async function calcCostFromBom() {
  if (!fd.id) return
  bomCostLoading.value = true
  bomCostDetail.value = ''
  try {
    const res = await getBomByGoods(fd.id)
    const rows: any[] = res.data?.rows ?? []
    if (!rows.length) {
      ElMessage.warning('该商品暂无BOM物料清单，请先在BOM计划里添加物料')
      return
    }
    // 从 localStorage 读取各物料单价
    const prices: Record<number, number> = (() => {
      try { return JSON.parse(localStorage.getItem('erp_bom_prices') || '{}') } catch { return {} }
    })()
    let total = 0
    const details: string[] = []
    for (const r of rows) {
      const price = prices[r.id] ?? 0
      const subtotal = (r.num || 0) * price
      total += subtotal
      if (r.material_name !== '（待添加物料）') {
        details.push(`${r.material_name}×${r.num} @¥${price.toFixed(2)} = ¥${subtotal.toFixed(2)}`)
      }
    }
    fd.cost_price = Number(total.toFixed(2))
    bomCostDetail.value = details.join('；')
    ElMessage.success(`BOM核算成本：¥${total.toFixed(2)}，已填入成本价`)
  } catch (e: any) {
    ElMessage.error(e?.message ?? '核算失败')
  } finally {
    bomCostLoading.value = false
  }
}

async function handleSave() {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning('请填写必填项（商品名称、商品分类、商品单位）'); return
  }
  // 新增时检查商品名是否已存在
  if (!fd.id) {
    const checkRes = await getGoodsList({ keyword: fd.goods_name, list_rows: 50 })
    const existRows = checkRes?.data?.rows ?? []
    const dup = existRows.find((r: any) => r.goods_name?.trim() === fd.goods_name?.trim())
    if (dup) { ElMessage.warning(`商品"${fd.goods_name}"已存在，请勿重复添加`); return }
  }
  saving.value = true
  try {
    const payload: any = { ...fd }
    // Convert boolean multi_unit/multi_spec to 0/1
    payload.multi_unit = fd.multi_unit ? 1 : 0
    payload.multi_spec = fd.multi_spec ? 1 : 0
    if (fd.id) {
      await updateGoods(payload)
    } else {
      const res = await createGoods(payload)
      fd.id = res.data?.id ?? 0
    }
    // Also persist goods_type locally for display in list
    if (fd.id && fd.goods_type) {
      const map = { ...goodsTypeMap.value, [fd.id]: fd.goods_type }
      goodsTypeMap.value = map
      saveGoodsTypeMap(map)
    }
    ElMessage.success('保存成功')
    // Save brand center fields to localStorage
    if (fd.id) saveBrandFd(fd.id)
    // Persist spec data (localStorage + backend sync)
    if (fd.id) persistSpecData(fd.id)
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleSaveAndNew() {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning('请填写必填项'); return
  }
  saving.value = true
  try {
    const payload: any = { ...fd }
    payload.multi_unit = fd.multi_unit ? 1 : 0
    payload.multi_spec = fd.multi_spec ? 1 : 0
    fd.id ? await updateGoods(payload) : await createGoods(payload)
    ElMessage.success('保存成功，已进入新增')
    Object.assign(fd, defaultFd())
    specList.value = []
    nextTick(() => scrollRef.value?.scrollTo({ top: 0 }))
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleClearAll() {
  await ElMessageBox.confirm(
    '确定清空全部商品？此操作不可撤销！所有商品数据将被永久删除。',
    '危险操作确认',
    { type: 'error', confirmButtonText: '确认清空', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
  )
  try {
    // 先获取全部商品 ID
    const res = await http.get('/goods/ShopGoods/index', { params: { list_rows: 1000 } })
    const rows: any[] = res?.data?.rows ?? []
    if (!rows.length) { ElMessage.info('商品列表已经是空的'); return }
    const ids = rows.map((r: any) => r.id).filter(Boolean)
    await http.post('/goods/ShopGoods/batchDel', { ids })
    ElMessage.success(`已删除 ${ids.length} 条商品`)
    tableRef.value?.loadData()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '删除失败，请手动全选后批量删除')
  }
}

async function handleDelete(id: number) {
  try {
    const res = await getStockList({ goods_id: id, list_rows: 200 })
    const rows = res?.data?.rows ?? res?.data ?? []
    const totalStock = rows.reduce((sum: number, r: any) => sum + (Number(r.stock_num) || Number(r.stock) || 0), 0)
    if (totalStock > 0) {
      ElMessage.warning(`该商品当前有库存（${totalStock}），无法删除。如需下架请在编辑中关闭状态。`)
      return
    }
  } catch {
    // 查库存失败，允许继续删除流程
  }
  await ElMessageBox.confirm('确定删除该商品？', '提示', { type: 'warning' })
  await deleteGoods(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

// ── 商品导入 ─────────────────────────────────────────────────────────────────
const importFileRef = ref<HTMLInputElement>()
const importDialogVisible = ref(false)
const importRows = ref<any[]>([])
const importLoading = ref(false)

// 模板列定义：Excel中文表头 -> API字段名
const IMPORT_COL_MAP: Record<string, string> = {
  '商品名称': 'goods_name',
  '商品编码': 'goods_sn',
  '英文名称': 'en_name',
  '商品类型': 'goods_type', // 成品/半成品/原材料/辅料 或 1/2/3/4
  '条码': 'barcode',
  '销售价': 'sell_price',
  '采购价': 'cost_price',
  '商品分类': 'cate_name',
  '规格型号': 'spec',
  '商品单位': 'unit_name',
  '品牌': 'brand_name',
  '安全库存下限': 'safe_min',
  '安全库存上限': 'safe_max',
  '备注': 'remark',
}

const IMPORT_COL_ALIASES: Record<string, string[]> = {
  goods_name: ['商品名称', '品名', '名称', 'goods_name'],
  goods_sn: ['商品编码', '商品编号', '编码', '编号', '货号', 'goods_sn'],
  en_name: ['英文名称', '英文名', 'en_name'],
  goods_type: ['商品类型', '类型', 'goods_type'],
  barcode: ['条码', '商品条码', '条形码', 'barcode'],
  sell_price: ['销售价', '售价', '零售价', 'sell_price'],
  cost_price: ['采购价', '成本价', '进价', 'cost_price'],
  cate_name: ['商品分类', '分类', '类别', 'cate_name'],
  spec: ['规格型号', '规格', '型号', 'spec'],
  unit_name: ['商品单位', '单位', 'unit_name'],
  brand_name: ['品牌', '商品品牌', 'brand_name'],
  safe_min: ['安全库存下限', '最低库存', 'safe_min'],
  safe_max: ['安全库存上限', '最高库存', 'safe_max'],
  remark: ['备注', '说明', 'remark'],
}

const IMPORT_FIELD_LABELS: Record<string, string> = {
  goods_name: '商品名称',
  goods_sn: '商品编码',
  en_name: '英文名称',
  goods_type: '商品类型',
  barcode: '条码',
  sell_price: '销售价',
  cost_price: '采购价',
  cate_name: '商品分类',
  spec: '规格型号',
  unit_name: '商品单位',
  brand_name: '品牌',
  safe_min: '安全库存下限',
  safe_max: '安全库存上限',
  remark: '备注',
}

const IMPORT_REQUIRED_FIELDS = ['goods_name', 'cate_name', 'unit_name'] as const

const GOODS_TYPE_TEXT_MAP: Record<string, number> = {
  '成品': 1, '半成品': 2, '原材料': 3, '辅料': 4,
}

const IMPORT_ALIAS_TO_FIELD = Object.entries(IMPORT_COL_ALIASES).reduce<Record<string, string>>((acc, [field, aliases]) => {
  aliases.forEach(alias => {
    acc[normalizeImportHeader(alias)] = field
  })
  return acc
}, {})

function normalizeImportHeader(value: any) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[：:]/g, '')
    .toLowerCase()
}

function normalizeImportCell(value: any) {
  if (value == null) return ''
  return typeof value === 'string' ? value.trim() : value
}

function normalizeImportName(value: any) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function resolveImportField(header: any): string {
  const normalized = normalizeImportHeader(header)
  return IMPORT_ALIAS_TO_FIELD[normalized] ?? ''
}

function scoreImportHeaderRow(row: any[]): number {
  return new Set((row ?? []).map(cell => resolveImportField(cell)).filter(Boolean)).size
}

function hasImportRowData(row: any[] = []) {
  return row.some(cell => normalizeImportCell(cell) !== '')
}

function parseImportSheetRows(sheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false }) as any[][]
}

function pickImportSheet(workbook: XLSX.WorkBook) {
  let best: { sheetName: string; headerRowIndex: number; score: number; dataCount: number } | null = null
  for (const sheetName of workbook.SheetNames) {
    const rows = parseImportSheetRows(workbook.Sheets[sheetName])
    let bestHeaderIndex = -1
    let bestHeaderScore = 0
    const scanRows = rows.slice(0, 10)
    scanRows.forEach((row, index) => {
      const score = scoreImportHeaderRow(row)
      if (score > bestHeaderScore) {
        bestHeaderScore = score
        bestHeaderIndex = index
      }
    })
    const dataCount = bestHeaderIndex >= 0
      ? rows.slice(bestHeaderIndex + 1).filter(hasImportRowData).length
      : rows.filter(hasImportRowData).length

    if (
      !best ||
      bestHeaderScore > best.score ||
      (bestHeaderScore === best.score && dataCount > best.dataCount)
    ) {
      best = { sheetName, headerRowIndex: bestHeaderIndex, score: bestHeaderScore, dataCount }
    }
  }
  return best
}

function fillImportRelationFields(row: any) {
  if (row.cate_name) {
    const cate = findImportCategoryByPath(row.cate_name)
    if (cate) {
      row.cate_id = cate.id
      row.cate_name = cate.name
    }
  }
  if (row.unit_name) {
    const unit = unitOptions.value.find(item => normalizeImportHeader(item.name) === normalizeImportHeader(row.unit_name))
    if (unit) {
      row.unit_id = unit.id
      row.unit_name = unit.name
    }
  }
  if (row.brand_name) {
    const brand = brandOptions.value.find(item => normalizeImportHeader(item.name) === normalizeImportHeader(row.brand_name))
    if (brand) {
      row.brand_id = brand.id
      row.brand_name = brand.name
    }
  }
}

function buildImportRow(cells: any[], fieldKeys: string[], rowNo: number) {
  const mapped: any = {}

  fieldKeys.forEach((field, index) => {
    if (!field || mapped[field] !== undefined) return
    const value = normalizeImportCell(cells[index])
    if (value !== '') mapped[field] = value
  })

  for (const key of ['goods_name', 'goods_sn', 'en_name', 'barcode', 'remark', 'cate_name', 'spec', 'unit_name', 'brand_name'] as const) {
    if (mapped[key] !== undefined) mapped[key] = String(mapped[key]).trim()
  }

  for (const key of ['sell_price', 'cost_price', 'safe_min', 'safe_max'] as const) {
    if (mapped[key] === undefined || mapped[key] === '') continue
    const num = Number(mapped[key])
    if (!Number.isNaN(num)) mapped[key] = num
  }

  if (/^0+(?:\.0+)?$/.test(String(mapped.barcode ?? '').trim())) mapped.barcode = ''

  const rawGoodsType = String(mapped.goods_type ?? '').trim()
  mapped._missingGoodsType = rawGoodsType === ''
  if (!mapped._missingGoodsType) {
    if (Number.isNaN(Number(mapped.goods_type))) {
      mapped.goods_type = GOODS_TYPE_TEXT_MAP[String(mapped.goods_type).trim()] ?? undefined
    } else {
      const num = Number(mapped.goods_type)
      mapped.goods_type = [1, 2, 3, 4].includes(num) ? num : undefined
    }
  }
  // 商品类型缺失时，遍历已有类型映射，匹配商品名称中包含的类型名（"半成品"优先于"成品"）
  if (!mapped.goods_type) {
    const name = String(mapped.goods_name ?? '')
    // 按类型名长度降序，确保"半成品"先于"成品"匹配
    const sortedEntries = Object.entries(GOODS_TYPE_TEXT_MAP).sort((a, b) => b[0].length - a[0].length)
    for (const [typeName, typeVal] of sortedEntries) {
      if (name.includes(typeName)) {
        mapped.goods_type = typeVal
        break
      }
    }
  }
  mapped._missingGoodsType = !mapped.goods_type
  mapped.goods_type_text = mapped.goods_type
    ? (['', '成品', '半成品', '原材料', '辅料'][mapped.goods_type] ?? '未指定')
    : '未指定'

  fillImportRelationFields(mapped)

  const missingFields = IMPORT_REQUIRED_FIELDS.filter(field => !String(mapped[field] ?? '').trim())
  mapped._rowNo = rowNo
  mapped._error = missingFields.length > 0
  mapped._errorText = mapped._error
    ? `第 ${rowNo} 行缺少：${missingFields.map(field => IMPORT_FIELD_LABELS[field]).join('、')}`
    : ''

  return mapped
}

function splitImportCategoryPath(value: any) {
  return String(value ?? '')
    .split('/')
    .map(item => item.trim())
    .filter(Boolean)
}

function findImportCategoryByNameAndParent(name: string, parentId: number) {
  return cateOptions.value.find(item =>
    normalizeImportHeader(item.name) === normalizeImportHeader(name)
    && Number(item.parent_id ?? 0) === Number(parentId ?? 0),
  )
}

function findImportCategoryByPath(path: any) {
  const segments = splitImportCategoryPath(path)
  if (!segments.length) return null

  let parentId: number = 0
  let current: any = null
  for (const segment of segments) {
    current = findImportCategoryByNameAndParent(segment, parentId)
    if (!current) return null
    parentId = current.id
  }
  return current
}

async function ensureImportCategory(path: any) {
  const segments = splitImportCategoryPath(path)
  if (!segments.length) return null

  let parentId: number = 0
  let current: any = null

  for (const segment of segments) {
    const existed = findImportCategoryByNameAndParent(segment, parentId)
    if (existed) {
      current = existed
      parentId = existed.id
      continue
    }

    const res = await createGoodsCate({ name: segment, parent_id: parentId })
    const newId = res.data?.id ?? res.data?.rows?.[0]?.id ?? 0

    if (newId) {
      current = { id: newId, name: segment, parent_id: parentId, sort: 0 }
      cateOptions.value = [...cateOptions.value, current]
      parentId = newId
      continue
    }

    // 后端返回已存在，重新加载后复用
    await loadCates()
    current = findImportCategoryByNameAndParent(segment, parentId)
    if (!current) throw new Error(`分类创建失败：${segment}`)
    parentId = current.id
  }

  return current
}

async function detectImportDuplicateNames(rows: any[]) {
  const validRows = rows.filter(row => !row._error && String(row.goods_name ?? '').trim())
  const nameMap = new Map<string, any[]>()

  validRows.forEach(row => {
    const key = normalizeImportName(row.goods_name)
    if (!key) return
    const list = nameMap.get(key) ?? []
    list.push(row)
    nameMap.set(key, list)
  })

  const duplicatedInFile = new Map<string, any[]>()
  nameMap.forEach((list, key) => {
    if (list.length > 1) duplicatedInFile.set(key, list)
  })

  const names = [...nameMap.keys()]
  const existingNameSet = new Set<string>()
  await Promise.all(names.map(async (name) => {
    try {
      const sourceName = nameMap.get(name)?.[0]?.goods_name ?? ''
      const res = await getGoodsList({ keyword: sourceName, page: 1, list_rows: 20 })
      const rows = res.data?.rows ?? []
      const exact = rows.some((item: any) => normalizeImportName(item.goods_name) === name)
      if (exact) existingNameSet.add(name)
    } catch {}
  }))

  return { duplicatedInFile, existingNameSet }
}

function triggerImport() {
  importFileRef.value?.click()
}

function handleImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const data = new Uint8Array(ev.target!.result as ArrayBuffer)
    const wb = XLSX.read(data, { type: 'array' })
    const bestSheet = pickImportSheet(wb)
    if (!bestSheet || bestSheet.score <= 0 || bestSheet.headerRowIndex < 0) {
      ElMessage.warning('未识别到可导入的表头，请检查模板或表头名称')
      return
    }

    const ws = wb.Sheets[bestSheet.sheetName]
    const rows = parseImportSheetRows(ws)
    const headerRow = rows[bestSheet.headerRowIndex] ?? []
    const fieldKeys = headerRow.map(cell => resolveImportField(cell))
    const bodyRows = rows.slice(bestSheet.headerRowIndex + 1).filter(hasImportRowData)
    if (!bodyRows.length) { ElMessage.warning('Excel文件无数据'); return }

    importRows.value = bodyRows.map((row, index) => buildImportRow(row, fieldKeys, bestSheet.headerRowIndex + index + 2))
    importDialogVisible.value = true
  }
  reader.readAsArrayBuffer(file)
  // Reset input so same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

async function confirmImport() {
  const { duplicatedInFile, existingNameSet } = await detectImportDuplicateNames(importRows.value)
  const hasDuplicateNames = duplicatedInFile.size > 0 || existingNameSet.size > 0
  const skippedNameSet = new Set<string>()
  const duplicateKeptRows = new Set<number>()

  if (hasDuplicateNames) {
    duplicatedInFile.forEach((rows) => {
      if (rows.length > 0) duplicateKeptRows.add(rows[0]._rowNo)
    })
    const importExamples = [...duplicatedInFile.values()].slice(0, 3).map(rows => String(rows[0]?.goods_name ?? '')).filter(Boolean)
    const existingExamples = [...existingNameSet].slice(0, 3).map(key => {
      const row = importRows.value.find(item => normalizeImportName(item.goods_name) === key)
      return String(row?.goods_name ?? '')
    }).filter(Boolean)
    const messages: string[] = []
    if (duplicatedInFile.size > 0) messages.push(`Excel 内有 ${duplicatedInFile.size} 个重名商品${importExamples.length ? `：${importExamples.join('、')}` : ''}`)
    if (existingNameSet.size > 0) messages.push(`系统内已存在 ${existingNameSet.size} 个同名商品${existingExamples.length ? `：${existingExamples.join('、')}` : ''}`)

    // 自动跳过所有重名，不再询问
    duplicatedInFile.forEach((_rows, key) => skippedNameSet.add(key))
    existingNameSet.forEach(key => skippedNameSet.add(key))
    ElMessage.warning(`${messages.join('；')}，已自动跳过`)
  }

  importLoading.value = true
  let success = 0, failed = 0, skipped = 0
  let typeMapChanged = false
  let cateChanged = false
  const nextGoodsTypeMap = { ...goodsTypeMap.value }
  for (const row of importRows.value) {
    const { goods_type_text, _error, _errorText, _rowNo, _missingGoodsType, ...payload } = row
    if (_error) {
      skipped++
      continue
    }
    const normalizedName = normalizeImportName(payload.goods_name)
    if (skippedNameSet.has(normalizedName)) {
      if (duplicatedInFile.has(normalizedName) && duplicateKeptRows.has(_rowNo) && !existingNameSet.has(normalizedName)) {
        duplicateKeptRows.delete(_rowNo)
      } else {
        skipped++
        continue
      }
    }
    try {
      const resolvedGoodsType = Number(payload.goods_type)
      const validTypeVals = Object.values(GOODS_TYPE_TEXT_MAP)
      const hasGoodsType = validTypeVals.includes(resolvedGoodsType)
      if (hasGoodsType) payload.goods_type = resolvedGoodsType
      else delete payload.goods_type
      if (payload.cate_name && !payload.cate_id) {
        const cate = await ensureImportCategory(payload.cate_name)
        if (cate) {
          payload.cate_id = cate.id
          payload.cate_name = cate.name
          cateChanged = true
        }
      }
      // 用商品编码检查是否已存在，避免重复导入
      if (payload.goods_sn) {
        const checkRes = await getGoodsList({ keyword: payload.goods_sn, list_rows: 10 })
        const exists = (checkRes.data?.rows ?? []).some((r: any) => r.goods_sn === payload.goods_sn)
        if (exists) { skipped++; continue }
      }
      const res = await createGoods({ ...payload, status: 1 })
      const id = res.data?.id ?? 0
      if (id) {
        nextGoodsTypeMap[id] = hasGoodsType ? resolvedGoodsType : 0
        typeMapChanged = true
      }
      success++
    } catch {
      failed++
    }
  }
  if (typeMapChanged) {
    goodsTypeMap.value = nextGoodsTypeMap
    saveGoodsTypeMap(nextGoodsTypeMap)
  }
  if (cateChanged) await loadCates()
  importLoading.value = false
  importDialogVisible.value = false
  ElMessage.success(`导入完成：成功 ${success} 条${failed > 0 ? `，失败 ${failed} 条` : ''}${skipped > 0 ? `，跳过 ${skipped} 条异常数据` : ''}`)
  tableRef.value?.refresh()
}

function downloadTemplate() {
  const headers = Object.keys(IMPORT_COL_MAP)
  const example: Record<string, any> = {
    '商品名称': '示例商品A',
    '商品编码': 'SP001',
    '英文名称': 'Sample Product A',
    '商品类型': '成品',
    '条码': '6901234567890',
    '销售价': 99.9,
    '采购价': 60,
    '商品分类': '一级分类>二级分类',
    '规格型号': '500g/袋',
    '商品单位': '袋',
    '品牌': '示例品牌',
    '安全库存下限': 10,
    '安全库存上限': 100,
    '备注': '',
  }
  const ws = XLSX.utils.json_to_sheet([example], { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '商品导入模板')
  XLSX.writeFile(wb, '商品导入模板.xlsx')
}

// Ctrl+S
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's' && showForm.value) { e.preventDefault(); handleSave() }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function onCateChange(v: any) { fd.cate_name = cateOptions.value.find(x => x.id === v)?.name ?? '' }
function onBrandChange(v: any) { fd.brand_name = brandOptions.value.find(x => x.id === v)?.name ?? '' }
function onUnitChange(v: any) { fd.unit_name = unitOptions.value.find(x => x.id === v)?.name ?? '' }

// ── 快速新增（分类/品牌/单位） ────────────────────────────────────────────────
const quickDialogVisible = ref(false)
const quickDialogTitle = ref('')
const quickName = ref('')
let quickType = ''

function quickAdd(type: string) {
  quickType = type
  quickName.value = ''
  quickDialogTitle.value = type === 'cate' ? '快速新增分类' : type === 'brand' ? '快速新增品牌' : '快速新增单位'
  quickDialogVisible.value = true
}

async function submitQuick() {
  if (!quickName.value.trim()) return
  let res: any
  if (quickType === 'cate') { res = await createGoodsCate({ name: quickName.value }); await loadCates() }
  else if (quickType === 'brand') { res = await createBrand({ name: quickName.value }); await loadOptions() }
  else { res = await createUnit({ name: quickName.value }); await loadOptions() }
  const id = res.data?.id ?? res.data?.rows?.[0]?.id
  if (quickType === 'cate') { fd.cate_id = id; onCateChange(id) }
  else if (quickType === 'brand') { fd.brand_id = id; onBrandChange(id) }
  else { fd.unit_id = id; onUnitChange(id) }
  quickDialogVisible.value = false
  ElMessage.success('添加成功')
}

// ── 规格（多规格编辑器） ────────────────────────────────────────────────────
interface SpecAttr {
  name: string
  values: string[]
  _inputVisible: boolean
  _inputVal: string
  _inputRef: any
}

const specAttrs = ref<SpecAttr[]>([])
const SKU_KEY = 'erp_sku_map'  // { goods_id: { skuKey: {sku_sn, sell_price, cost_price, stock, barcode} } }

interface SkuRow {
  vals: string[]
  sku_sn: string
  sell_price: number
  cost_price: number
  stock: number
  barcode: string
}
const skuList = ref<SkuRow[]>([])

function loadSkuData(goodsId: number) {
  try {
    const map = JSON.parse(localStorage.getItem(SKU_KEY) || '{}')
    return map[goodsId] ?? {}
  } catch { return {} }
}

function saveSkuData(goodsId: number) {
  try {
    const map = JSON.parse(localStorage.getItem(SKU_KEY) || '{}')
    const skuData: Record<string, any> = {}
    for (const row of skuList.value) {
      const key = row.vals.join('|')
      skuData[key] = { sku_sn: row.sku_sn, sell_price: row.sell_price, cost_price: row.cost_price, stock: row.stock, barcode: row.barcode }
    }
    map[goodsId] = skuData
    localStorage.setItem(SKU_KEY, JSON.stringify(map))
  } catch {}
}

const SPEC_ATTRS_KEY = 'erp_spec_attrs'  // { goods_id: [{name, values}] }

function loadSpecAttrs(goodsId: number) {
  try {
    const map = JSON.parse(localStorage.getItem(SPEC_ATTRS_KEY) || '{}')
    return (map[goodsId] ?? []).map((a: any) => ({ ...a, _inputVisible: false, _inputVal: '', _inputRef: null }))
  } catch { return [] }
}

function saveSpecAttrs(goodsId: number) {
  try {
    const map = JSON.parse(localStorage.getItem(SPEC_ATTRS_KEY) || '{}')
    map[goodsId] = specAttrs.value.map(a => ({ name: a.name, values: a.values }))
    localStorage.setItem(SPEC_ATTRS_KEY, JSON.stringify(map))
  } catch {}
}

// Also sync with backend spec API (best-effort)
async function loadSpecs() {
  if (!fd.id) { specAttrs.value = []; skuList.value = []; multiUnitRows.value = []; return }
  // Load from localStorage first (source of truth for our multi-spec)
  specAttrs.value = loadSpecAttrs(fd.id)
  // Auto-enable multi_spec if saved spec attrs exist
  if (specAttrs.value.length > 0) fd.multi_spec = true
  rebuildSkuList()
  // Load multi-unit：优先从服务端取，没有再降级到 localStorage
  const serverUnits = await loadMultiUnitsFromServer(fd.id)
  const saved = serverUnits.length ? serverUnits : loadMultiUnits(fd.id)
  if (saved.length > 0) {
    multiUnitRows.value = saved
    fd.multi_unit = true
    minSaleUnitIdx.value = saved.findIndex(r => r.is_min_sale) ?? 0
    defaultSaleUnitIdx.value = saved.findIndex(r => r.is_default_sale) ?? 0
  } else if (fd.multi_unit) {
    multiUnitRows.value = [initBaseUnitRow()]
    minSaleUnitIdx.value = 0
    defaultSaleUnitIdx.value = 0
  }
}

function rebuildSkuList() {
  const validAttrs = specAttrs.value.filter(a => a.values.length > 0)
  if (validAttrs.length === 0) { skuList.value = []; return }

  // Cartesian product of all spec value arrays
  const combos = cartesian(validAttrs.map(a => a.values))
  const savedData = fd.id ? loadSkuData(fd.id) : {}

  skuList.value = combos.map(vals => {
    const key = vals.join('|')
    const saved = savedData[key] ?? {}
    return {
      vals,
      sku_sn: saved.sku_sn ?? '',
      sell_price: saved.sell_price ?? fd.sell_price ?? 0,
      cost_price: saved.cost_price ?? fd.cost_price ?? 0,
      stock: saved.stock ?? 0,
      barcode: saved.barcode ?? '',
    }
  })
}

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap(combo => arr.map(val => [...combo, val])),
    [[]]
  )
}

function onMultiSpecChange(val: any) {
  if (!val) { specAttrs.value = []; skuList.value = [] }
}

function addSpecAttr() {
  specAttrs.value.push({ name: '', values: [], _inputVisible: false, _inputVal: '', _inputRef: null })
}

function removeSpecAttr(idx: number) {
  specAttrs.value.splice(idx, 1)
  rebuildSkuList()
  if (fd.id) saveSpecAttrs(fd.id)
}

function removeSpecValue(aIdx: number, vIdx: number) {
  specAttrs.value[aIdx].values.splice(vIdx, 1)
  rebuildSkuList()
  if (fd.id) saveSpecAttrs(fd.id)
}

function showValueInput(aIdx: number) {
  specAttrs.value[aIdx]._inputVisible = true
  nextTick(() => { specAttrs.value[aIdx]._inputRef?.focus() })
}

function confirmAddValue(aIdx: number) {
  const attr = specAttrs.value[aIdx]
  const val = attr._inputVal.trim()
  if (val && !attr.values.includes(val)) {
    attr.values.push(val)
    rebuildSkuList()
    if (fd.id) saveSpecAttrs(fd.id)
  }
  attr._inputVisible = false
  attr._inputVal = ''
}

// Batch fill price dialog
const batchPriceVisible = ref(false)
const batchSellPrice = ref(0)
const batchCostPrice = ref(0)

function batchFillSkuPrice() {
  batchSellPrice.value = fd.sell_price ?? 0
  batchCostPrice.value = fd.cost_price ?? 0
  batchPriceVisible.value = true
}

function confirmBatchPrice() {
  for (const row of skuList.value) {
    row.sell_price = batchSellPrice.value
    row.cost_price = batchCostPrice.value
  }
  batchPriceVisible.value = false
  ElMessage.success('已批量填写价格')
}

// Save spec data along with goods save
function persistSpecData(goodsId: number) {
  if (fd.multi_spec) {
    saveSpecAttrs(goodsId)
    saveSkuData(goodsId)
    syncSpecToBackend(goodsId)
  }
  if (fd.multi_unit) {
    saveMultiUnits(goodsId)
    saveMultiUnitsToServer(goodsId)
  }
}

async function syncSpecToBackend(goodsId: number) {
  try {
    // Get existing specs
    const existing = await getSpecList({ goods_id: goodsId, list_rows: 200 })
    const rows: any[] = existing.data?.rows ?? []
    // Delete all existing
    for (const r of rows) await deleteSpec(r.id)
    // Re-create from specAttrs
    for (const attr of specAttrs.value) {
      if (attr.name && attr.values.length > 0) {
        await createSpec({ goods_id: goodsId, goods_name: fd.goods_name, spec_name: attr.name, spec_value: attr.values.join(',') })
      }
    }
  } catch {}
}

// Unused stubs kept to avoid import errors (specList used in old code still imported)
const specList = ref<any[]>([])

// ── 多单位 ────────────────────────────────────────────────────────────────────
const MULTI_UNIT_KEY = 'erp_goods_multi_unit_map'

interface MultiUnitRow {
  is_base: boolean
  unit_id: number | null
  unit_name: string
  ratio: number          // 换算关系：1 本单位 = ratio 基础单位
  is_min_sale: boolean
  is_default_sale: boolean
  cost_price: number     // 该单位对应的采购/成本价（自动换算）
  sell_price: number     // 该单位对应的销售价（自动换算）
}

const multiUnitRows = ref<MultiUnitRow[]>([])
const minSaleUnitIdx = ref(0)
const defaultSaleUnitIdx = ref(0)

// Auxiliary units = all rows except the base (index 0)
const auxUnitRows = computed(() => multiUnitRows.value.slice(1))

// 辅助单位下拉选项：unitOptions 里的名字 + 当前行已有的 unit_name，去重合并
const auxUnitSelectOptions = computed(() => {
  const names = new Set<string>()
  unitOptions.value.forEach(u => u.name && names.add(u.name))
  multiUnitRows.value.forEach(r => r.unit_name && names.add(r.unit_name))
  return Array.from(names)
})

async function loadMultiUnitsFromServer(goodsId: number): Promise<MultiUnitRow[]> {
  try {
    if (unitOptionsReady) await unitOptionsReady
    const res = await getUnitConvert(goodsId)
    const rows: any[] = res.data?.rows ?? []
    if (!rows.length) return []
    // 找到基础单位行（匹配 fd.unit_name），放第一位；其余为辅助单位
    const baseUnitName = fd.unit_name
    const baseCostPrice = Number(fd.cost_price) || 0
    const baseRow = rows.find(r => r.unit_name === baseUnitName)
    const auxRows = rows.filter(r => r.unit_name !== baseUnitName)
    const ordered = baseRow ? [baseRow, ...auxRows] : rows
    return ordered.map((r: any, i: number) => {
      const ratio = Number(r.ratio)
      return {
        is_base: i === 0,
        unit_id: null,
        unit_name: r.unit_name,
        ratio,
        is_min_sale: i === 0,
        is_default_sale: i === 0,
        cost_price: i === 0 ? baseCostPrice : Math.round(baseCostPrice * ratio * 100) / 100,
        sell_price: 0,
      }
    })
  } catch { return [] }
}

async function saveMultiUnitsToServer(goodsId: number) {
  try {
    const units = multiUnitRows.value.map(r => ({ unit_name: r.unit_name, ratio: r.ratio }))
    await saveUnitConvert({ goods_id: goodsId, units })
  } catch { /* 静默失败，不影响主流程 */ }
}

function loadMultiUnits(goodsId: number): MultiUnitRow[] {
  try {
    const map = JSON.parse(localStorage.getItem(MULTI_UNIT_KEY) || '{}')
    const rows: MultiUnitRow[] = map[goodsId] ?? []
    return rows.map(r => ({ cost_price: 0, sell_price: 0, ...r }))
  } catch { return [] }
}

function saveMultiUnits(goodsId: number) {
  try {
    const map = JSON.parse(localStorage.getItem(MULTI_UNIT_KEY) || '{}')
    map[goodsId] = multiUnitRows.value.map((r, i) => ({
      ...r,
      is_min_sale: i === minSaleUnitIdx.value,
      is_default_sale: i === defaultSaleUnitIdx.value,
    }))
    localStorage.setItem(MULTI_UNIT_KEY, JSON.stringify(map))
  } catch {}
}

function initBaseUnitRow() {
  const baseUnit = unitOptions.value.find(u => u.id === fd.unit_id)
  return {
    is_base: true,
    unit_id: fd.unit_id,
    unit_name: baseUnit?.name ?? fd.unit_name ?? '',
    ratio: 1,
    is_min_sale: true,
    is_default_sale: true,
    cost_price: fd.cost_price ?? 0,
    sell_price: fd.sell_price ?? 0,
  } as MultiUnitRow
}

function onMultiUnitChange(val: any) {
  if (val) {
    if (multiUnitRows.value.length === 0) {
      multiUnitRows.value = [initBaseUnitRow()]
      minSaleUnitIdx.value = 0
      defaultSaleUnitIdx.value = 0
    } else {
      // 更新基础单位行的 unit_name
      if (multiUnitRows.value[0]) {
        const baseUnit = unitOptions.value.find(u => u.id === fd.unit_id)
        multiUnitRows.value[0].unit_id = fd.unit_id
        multiUnitRows.value[0].unit_name = baseUnit?.name ?? fd.unit_name ?? ''
      }
    }
  }
}

function addMultiUnitRow() {
  multiUnitRows.value.push({
    is_base: false,
    unit_id: null,
    unit_name: '',
    ratio: 1,
    is_min_sale: false,
    is_default_sale: false,
    cost_price: fd.cost_price ?? 0,
    sell_price: fd.sell_price ?? 0,
  })
}

function removeMultiUnitRow(idx: number) {
  multiUnitRows.value.splice(idx, 1)
  if (minSaleUnitIdx.value >= multiUnitRows.value.length) minSaleUnitIdx.value = 0
  if (defaultSaleUnitIdx.value >= multiUnitRows.value.length) defaultSaleUnitIdx.value = 0
}

function onMultiUnitSelect(unitName: string, idx: number) {
  if (unitName) multiUnitRows.value[idx].unit_name = unitName
}

function onMultiUnitRatioChange(row: MultiUnitRow) {
  // Auto-calculate prices: aux_price = base_price * ratio
  const baseCost = Number(fd.cost_price) || 0
  const baseSell = Number(fd.sell_price) || 0
  row.cost_price = Math.round(baseCost * row.ratio * 100) / 100
  row.sell_price = Math.round(baseSell * row.ratio * 100) / 100
}

// When base cost_price or sell_price changes, recalc all aux unit prices
watch(() => fd.cost_price, (newCost) => {
  if (!fd.multi_unit) return
  const base = Number(newCost) || 0
  // Also sync base unit row (index 0)
  if (multiUnitRows.value[0]) multiUnitRows.value[0].cost_price = base
  // Recalc aux rows (index 1+)
  for (let i = 1; i < multiUnitRows.value.length; i++) {
    const row = multiUnitRows.value[i]
    row.cost_price = Math.round(base * row.ratio * 100) / 100
  }
})

watch(() => fd.sell_price, (newSell) => {
  if (!fd.multi_unit) return
  const base = Number(newSell) || 0
  if (multiUnitRows.value[0]) multiUnitRows.value[0].sell_price = base
  for (let i = 1; i < multiUnitRows.value.length; i++) {
    const row = multiUnitRows.value[i]
    row.sell_price = Math.round(base * row.ratio * 100) / 100
  }
})



// ── 标签页滚动高亮 ────────────────────────────────────────────────────────────
const tabs = [
  { key: 'base', label: '基本信息' },
  { key: 'unit', label: '计量单位' },
  { key: 'spec', label: '规格设置' },
  { key: 'price', label: '价格&条码' },
  { key: 'remark', label: '备注信息' },
  { key: 'brand', label: '品牌中心' },
]
const activeTab = ref('base')
const scrollRef = ref<HTMLDivElement>()
const secBase = ref<HTMLDivElement>()
const secUnit = ref<HTMLDivElement>()
const secSpec = ref<HTMLDivElement>()
const secPrice = ref<HTMLDivElement>()
const secRemark = ref<HTMLDivElement>()
const secBrand = ref<HTMLDivElement>()

function scrollToSection(key: string) {
  const map: Record<string, any> = { base: secBase, unit: secUnit, spec: secSpec, price: secPrice, remark: secRemark, brand: secBrand }
  map[key]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeTab.value = key
}

function onScroll() {
  const refs = [
    { key: 'brand', el: secBrand }, { key: 'remark', el: secRemark }, { key: 'price', el: secPrice },
    { key: 'spec', el: secSpec }, { key: 'unit', el: secUnit }, { key: 'base', el: secBase },
  ]
  const container = scrollRef.value
  if (!container) return
  const top = container.scrollTop + 80
  for (const { key, el } of refs) {
    if (el.value && el.value.offsetTop <= top) { activeTab.value = key; return }
  }
}

// ── 品牌中心字段 (localStorage) ───────────────────────────────────────────────
const BRAND_STORE_KEY = 'erp_brand_center_data'

interface BrandCenterItem {
  wholesalePrice: number
  minOrderQuantity: number
  tags: string[]
  image: string
  headerImages: string[]
  detailImage: string
}

function loadBrandMap(): Record<string, BrandCenterItem> {
  try { return JSON.parse(localStorage.getItem(BRAND_STORE_KEY) ?? '{}') } catch { return {} }
}
function saveBrandMap(map: Record<string, BrandCenterItem>) {
  localStorage.setItem(BRAND_STORE_KEY, JSON.stringify(map))
}

const defaultBrandFd = (): BrandCenterItem => ({
  wholesalePrice: 0,
  minOrderQuantity: 1,
  tags: [],
  image: '',
  headerImages: ['', '', '', ''],
  detailImage: '',
})

const brandFd = reactive(defaultBrandFd())

const TAG_OPTIONS = [
  { value: 'new', label: '新品' },
  { value: 'hot', label: '热销' },
  { value: 'sale', label: '特惠' },
]

function loadBrandFd(goodsId: number) {
  const map = loadBrandMap()
  const saved = map[String(goodsId)]
  Object.assign(brandFd, defaultBrandFd(), saved ?? {})
  // Ensure headerImages always has 4 slots
  while (brandFd.headerImages.length < 4) brandFd.headerImages.push('')
}

function saveBrandFd(goodsId: number) {
  const map = loadBrandMap()
  map[String(goodsId)] = {
    wholesalePrice: brandFd.wholesalePrice,
    minOrderQuantity: brandFd.minOrderQuantity,
    tags: brandFd.tags,
    image: brandFd.image,
    headerImages: brandFd.headerImages.slice(0, 4),
    detailImage: brandFd.detailImage,
  }
  saveBrandMap(map)
}

function toggleBrandTag(tag: string) {
  const idx = brandFd.tags.indexOf(tag)
  if (idx >= 0) brandFd.tags.splice(idx, 1)
  else brandFd.tags.push(tag)
}

// ── 扫码录入 ──────────────────────────────────────────────────────────────────
const listScannerVisible = ref(false)
const listScanning = ref(false)
const listScanLooking = ref(false)
const listScanError = ref('')
const listVideoRef = ref<HTMLVideoElement>()
let listCodeReader: BrowserMultiFormatReader | null = null
let listScanStream: MediaStream | null = null

async function openListScanner() {
  listScanError.value = ''
  listScanning.value = false
  listScanLooking.value = false
  listScannerVisible.value = true
  setTimeout(startListScanner, 300)
}

async function startListScanner() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    listScanStream = stream
    if (listVideoRef.value) listVideoRef.value.srcObject = stream
    listScanning.value = true
    listCodeReader = new BrowserMultiFormatReader()
    listCodeReader.decodeFromStream(stream, listVideoRef.value!, async (result) => {
      if (!result) return
      const code = result.getText()
      stopListScanner()
      listScanLooking.value = true

      // 1. 先查本系统是否已有该条码
      try {
        const res = await getGoodsList({ keyword: code, list_rows: 5 })
        const rows: any[] = res.data?.rows ?? []
        const match = rows.find((r: any) => r.barcode === code || r.goods_sn === code)
        if (match) {
          listScannerVisible.value = false
          listScanLooking.value = false
          ElMessage.info('该条码商品已存在，已打开编辑页面')
          openEdit(match)
          return
        }
      } catch {}

      // 2. 查公开条码库（Open Food Facts，对进口食品有效）
      const prefill: any = { barcode: code }
      try {
        const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, { signal: AbortSignal.timeout(5000) })
        const j = await r.json()
        if (j.status === 1 && j.product) {
          const p = j.product
          const name = p.product_name_zh || p.product_name || ''
          const brand = p.brands || ''
          const quantity = p.quantity || ''
          if (name) prefill.goods_name = name + (quantity ? ` ${quantity}` : '')
          if (brand) prefill.brand_name = brand
        }
      } catch {}

      listScannerVisible.value = false
      listScanLooking.value = false
      openCreate()
      Object.assign(fd, prefill)
      if (prefill.goods_name) {
        ElMessage.success(`已识别：${prefill.goods_name}，请补充完整信息`)
      } else {
        ElMessage.success(`条码已识别：${code}，请填写商品信息`)
      }
    })
  } catch (e: any) {
    listScanError.value = e?.message ?? '摄像头启动失败，请检查浏览器权限'
    listScanning.value = false
  }
}

function stopListScanner() {
  try { listCodeReader?.reset() } catch {}
  listCodeReader = null
  listScanning.value = false
  if (listScanStream) { listScanStream.getTracks().forEach(t => t.stop()); listScanStream = null }
  if (listVideoRef.value) listVideoRef.value.srcObject = null
}
</script>

<style scoped>
/* ── 列表页布局 ── */
.goods-page { height: 100%; }

.list-layout {
  display: flex;
  gap: 0;
  height: calc(100vh - 110px);
  min-height: 500px;
}

/* 左侧分类 */
.cate-panel {
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 0;
}

.cate-resize-handle {
  width: 5px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  margin-right: 12px;
}
.cate-resize-handle:hover {
  background: #dbeafe;
}

.cate-view-tabs {
  display: flex;
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.cate-view-tab {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 8px 0;
  cursor: pointer;
  color: rgba(29,29,31,0.5);
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.cate-view-tab.active {
  color: #0071e3;
  border-bottom-color: #0071e3;
  font-weight: 500;
}

.cate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.cate-title { font-size: 13px; font-weight: 600; color: #1d1d1f; }

.cate-search { padding: 8px 10px; flex-shrink: 0; }

.cate-tree { flex: 1; overflow-y: auto; }

.cate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  cursor: pointer;
  transition: background 0.12s;
}
.cate-item:hover { background: #f5f7ff; }
.cate-item:hover .cate-item-actions,
.el-tree-node__content:hover .cate-item-actions { opacity: 1; }
.cate-item.active { background: rgba(0,113,227,0.08); color: #0071e3; font-weight: 500; }
.cate-item-child { padding-left: 20px; font-size: 12px; color: rgba(29,29,31,0.35); }
.cate-item-child.active { color: #0071e3; }
.cate-arrow { font-size: 12px; margin-right: 4px; color: rgba(29,29,31,0.35); transition: transform 0.2s; flex-shrink: 0; cursor: pointer; }
.cate-arrow.expanded { transform: rotate(90deg); }
.cate-arrow-placeholder { display: inline-block; width: 16px; flex-shrink: 0; }

.cate-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cate-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}

.act-icon {
  font-size: 13px;
  color: rgba(29,29,31,0.35);
  cursor: pointer;
  padding: 2px;
}
.act-icon:hover { color: #0071e3; }
.act-icon.danger:hover { color: #dc2626; }

.cate-empty { text-align: center; color: rgba(29,29,31,0.35); font-size: 12px; padding: 20px 0; }

/* 右侧商品列表 */
.goods-list-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 移动端 chip 默认隐藏，PC端 pc-only 显示 */
.mobile-cate-chips { display: none; }

@media (max-width: 767px) {
  .list-layout { flex-direction: column !important; height: auto !important; }
  .cate-panel { position: sticky !important; top: 0 !important; z-index: 20 !important; width: 100% !important; margin-right: 0 !important; margin-bottom: 8px; border-radius: 14px; max-height: none !important; overflow: visible !important; }
  .cate-search { display: none !important; }
  .cate-header { border-bottom: none !important; padding-bottom: 4px !important; }
  .cate-tree { display: block !important; overflow-x: auto !important; overflow-y: visible !important; padding: 0 10px 8px !important; height: auto !important; }
  /* 隐藏 PC 树形，显示移动端 chip */
  .pc-only { display: none !important; }
  .mobile-cate-chips { display: flex !important; flex-direction: column; gap: 6px; }
  .mobile-chip-row { display: flex; flex-direction: row; flex-wrap: nowrap; gap: 6px; overflow-x: auto; scrollbar-width: none; }
  .mobile-chip-row::-webkit-scrollbar { display: none; }
  .mobile-chip-sub { padding-left: 4px; border-left: 3px solid rgba(0,113,227,0.2); margin-left: 2px; }
  .cate-chip { flex-shrink: 0; border-radius: 20px; padding: 5px 14px; background: #f5f5f7; border: 1px solid transparent; white-space: nowrap; font-size: 13px; color: rgba(29,29,31,0.7); cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .cate-chip.active { background: rgba(0,113,227,0.08); color: #0071e3; border-color: rgba(0,113,227,0.2); }
  .cate-chip-sub { font-size: 12px; padding: 4px 12px; }
  .cate-arrow, .cate-arrow-placeholder { display: none !important; }
  .goods-list-wrap { overflow: visible !important; min-height: 0 !important; }
  .goods-list-wrap :deep(.sc-table) { min-width: 0 !important; padding: 10px !important; }
}

/* 商品卡片（移动端） */
.goods-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.goods-card:active { transform: scale(0.99); }
.goods-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 10px;
}
.goods-card-title span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 13px;
}
.goods-card-label { color: rgba(29,29,31,0.4); font-size: 11px; font-weight: 600; }
.goods-card-value { font-weight: 600; color: #1d1d1f; }
.goods-card-value.blue { color: #0071e3; }
.goods-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.goods-card-sn { font-size: 11px; color: rgba(29,29,31,0.3); }

/* ── 全页表单 ── */
.form-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  background: #f5f6fa;
}

.form-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  flex-shrink: 0;
  height: 48px;
}

.form-tabs-nav { display: flex; height: 100%; align-items: stretch; }

.tab-item {
  padding: 0 18px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
}
.tab-item:hover { color: #0071e3; }
.tab-item.active { color: #0071e3; border-bottom-color: #0071e3; font-weight: 500; }

.form-actions { display: flex; gap: 8px; }

.form-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px 8px;
  border: 1px solid #e4e7ed;
}

.sec-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f7;
}

.sec-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f7;
}

.sec-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.row-with-add { display: flex; gap: 8px; width: 100%; }

.field-hint { font-size: 11px; color: rgba(29,29,31,0.35); margin-top: 4px; line-height: 1.4; }

/* ── 多规格编辑器 ── */
.spec-editor { padding: 4px 0; }

.spec-attr-row {
  background: #f8f9fd;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.spec-attr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.spec-attr-name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spec-attr-label {
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  white-space: nowrap;
  flex-shrink: 0;
}

.spec-attr-values {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.spec-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  flex: 1;
}

/* ── 品牌中心 ── */
.brand-center-section .sec-title { display: flex; align-items: center; gap: 10px; }
.brand-sec-badge {
  font-size: 10px; font-weight: 600;
  background: rgba(124,58,237,0.1); color: #7c3aed;
  padding: 2px 8px; border-radius: 999px; letter-spacing: 0.02em;
}
.brand-tag-row { display: flex; gap: 8px; flex-wrap: wrap; }
.brand-tag-check {
  padding: 5px 14px; border-radius: 999px;
  font-size: 12px; font-weight: 700;
  border: 1.5px solid rgba(0,0,0,0.1);
  cursor: pointer; transition: all 0.2s;
  background: #f5f5f7; color: rgba(29,29,31,0.5);
  user-select: none;
}
.brand-tag-check.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.brand-img-preview {
  display: block; margin-top: 8px;
  max-width: 200px; max-height: 120px;
  object-fit: cover; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
}
.brand-carousel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
.brand-carousel-item { display: flex; flex-direction: column; gap: 6px; }
.brand-img-preview-sm {
  display: block; max-width: 140px; max-height: 80px;
  object-fit: cover; border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08);
}
.brand-save-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(29,29,31,0.4);
  margin-top: 16px; padding: 10px 14px;
  background: #f5f5f7; border-radius: 10px;
}
.brand-save-hint.warn { background: #fffbf0; color: #d97706; }
</style>

<style>
/* ── 商品资料 暗黑模式 ── */
[data-theme="dark"] .cate-panel { background: #2c2c2e !important; border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .cate-header { background: #2c2c2e !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .cate-title { color: #f5f5f7 !important; }
[data-theme="dark"] .cate-item { color: rgba(245,245,247,0.55) !important; }
[data-theme="dark"] .cate-item:hover { background: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .cate-item.active { background: rgba(0,113,227,0.15) !important; color: #60a5fa !important; }
[data-theme="dark"] .cate-item-child { color: rgba(245,245,247,0.35) !important; }
[data-theme="dark"] .cate-arrow { color: rgba(245,245,247,0.3) !important; }
[data-theme="dark"] .cate-empty { color: rgba(245,245,247,0.3) !important; }
[data-theme="dark"] .goods-card { background: #2c2c2e !important; border-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .goods-card-title { color: #f5f5f7 !important; }
[data-theme="dark"] .goods-card-value { color: #f5f5f7 !important; }
[data-theme="dark"] .goods-card-label { color: rgba(245,245,247,0.4) !important; }
[data-theme="dark"] .goods-card-footer { border-top-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .goods-card-sn { color: rgba(245,245,247,0.3) !important; }
[data-theme="dark"] .form-page { background: #1c1c1e !important; }
[data-theme="dark"] .form-topbar { background: #2c2c2e !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .form-scroll { background: #1c1c1e !important; }
[data-theme="dark"] .form-section { background: #2c2c2e !important; border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .sec-title { color: #f5f5f7 !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .sec-title-row { border-bottom-color: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .sec-title-text { color: #f5f5f7 !important; }
[data-theme="dark"] .tab-item { color: rgba(245,245,247,0.5) !important; }
[data-theme="dark"] .tab-item.active { color: #60a5fa !important; border-bottom-color: #60a5fa !important; }
[data-theme="dark"] .spec-attr-row { background: #3a3a3c !important; border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .spec-attr-label { color: rgba(245,245,247,0.5) !important; }
[data-theme="dark"] .field-hint { color: rgba(245,245,247,0.35) !important; }
</style>
