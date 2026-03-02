<template>
  <div class="goods-page">

    <!-- ══════════════════════════════════════════════════════════
         列表页：左侧分类树 + 右侧商品表格
    ══════════════════════════════════════════════════════════ -->
    <div v-if="!showForm" class="list-layout">

      <!-- 左侧分类面板 -->
      <div class="cate-panel">
        <div class="cate-header">
          <span class="cate-title">商品分类</span>
          <el-button :icon="Plus" size="small" circle @click="openCateForm()" />
        </div>
        <div class="cate-search">
          <el-input v-model="cateKeyword" placeholder="搜索分类" clearable size="small" />
        </div>
        <div class="cate-tree" v-loading="cateLoading">
          <!-- 全部 -->
          <div class="cate-item" :class="{ active: selectedCateId === null }" @click="selectCate(null)">
            全部
          </div>
          <template v-for="item in cateTree" :key="item.id">
            <div class="cate-item" :class="{ active: selectedCateId === item.id }" @click="selectCate(item.id)">
              <!-- 有子分类时显示三角 -->
              <el-icon v-if="item.children.length" class="cate-arrow"
                :class="{ expanded: !collapsedCates.has(item.id) }"
                @click.stop="toggleCate(item.id)">
                <ArrowRight />
              </el-icon>
              <span v-else class="cate-arrow-placeholder" />
              <span class="cate-item-name">{{ item.name }}</span>
              <span class="cate-item-actions">
                <el-icon class="act-icon" @click.stop="openCateForm(item)"><Edit /></el-icon>
                <el-icon class="act-icon danger" @click.stop="handleDeleteCate(item.id)"><Delete /></el-icon>
              </span>
            </div>
            <!-- 子分类（可折叠） -->
            <template v-if="!collapsedCates.has(item.id)">
              <template v-for="child in item.children" :key="child.id">
                <div class="cate-item cate-item-child" :class="{ active: selectedCateId === child.id }" @click="selectCate(child.id)">
                  <span class="cate-item-name">└ {{ child.name }}</span>
                  <span class="cate-item-actions">
                    <el-icon class="act-icon" @click.stop="openCateForm(child)"><Edit /></el-icon>
                    <el-icon class="act-icon danger" @click.stop="handleDeleteCate(child.id)"><Delete /></el-icon>
                  </span>
                </div>
              </template>
            </template>
          </template>
          <div v-if="!cateLoading && cateTree.length === 0" class="cate-empty">暂无分类</div>
        </div>
      </div>

      <!-- 右侧商品列表 -->
      <div class="goods-list-wrap">
        <ScTable ref="tableRef" :api-obj="getGoodsList"
          del-path="/goods/ShopGoods/batchDel"
          export-file-name="商品列表" :params="searchForm" :row-filter="rowFilter">
          <template #search>
            <el-input v-model="searchForm.keyword" placeholder="输入关键字进行过滤" clearable style="width:200px" />
            <el-select v-model="filterType" placeholder="商品类型" clearable style="width:120px" @change="tableRef?.refresh()">
              <el-option label="成品" :value="1" />
              <el-option label="半成品" :value="2" />
              <el-option label="原材料" :value="3" />
              <el-option label="辅料" :value="4" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增</el-button>
          </template>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="goods_sn" label="商品编码" min-width="120" />
          <el-table-column prop="goods_name" label="商品名称" min-width="150" />
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="getGoodsType(row) === 2" type="warning" size="small">半成品</el-tag>
              <el-tag v-else-if="getGoodsType(row) === 3" type="info" size="small">原材料</el-tag>
              <el-tag v-else-if="getGoodsType(row) === 4" size="small">辅料</el-tag>
              <el-tag v-else type="success" size="small">成品</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="en_name" label="英文名称" min-width="120" />
          <el-table-column prop="unit_name" label="商品单位" width="90" align="center" />
          <el-table-column prop="cate_name" label="商品分类" min-width="110" />
          <el-table-column prop="cost_price" label="采购价" width="90" align="right" />
          <el-table-column prop="sell_price" label="销售价" width="90" align="right" />
          <el-table-column prop="brand_name" label="商品品牌" min-width="100" />
          <el-table-column prop="barcode" label="商品条码" min-width="120" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-switch :model-value="row.status === 1" disabled size="small" />
            </template>
          </el-table-column>
          <el-table-column label="相关操作" width="220" fixed="right" align="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
              <el-button type="success" link size="small" @click="openView(row)">查看</el-button>
              <el-button type="warning" link size="small" @click="openCopy(row)">复制</el-button>
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
                  <span :style="fd.multi_unit ? 'color:#165dff;font-weight:500' : ''">启用多单位</span>
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
                <span style="font-weight:600;color:#165dff">{{ fd.unit_name || '—' }}</span>
                <span style="color:#86909c">（换算基准：1 {{ fd.unit_name || '单位' }} = 1）</span>
                <span v-if="fd.cost_price" style="margin-left:8px;color:#52c41a">采购价：¥{{ Number(fd.cost_price).toFixed(2) }}</span>
                <span v-if="fd.sell_price" style="margin-left:8px;color:#165dff">销售价：¥{{ Number(fd.sell_price).toFixed(2) }}</span>
              </div>
              <!-- 辅助单位表格 -->
              <el-table :data="auxUnitRows" border size="small" style="width:100%">
                <el-table-column type="index" label="序号" width="55" align="center" />
                <el-table-column label="辅助单位" min-width="130">
                  <template #default="{ row, $index }">
                    <el-select v-if="!isView" v-model="row.unit_id" placeholder="请选择单位" size="small" style="width:100%"
                      @change="(v:any) => onMultiUnitSelect(v, $index + 1)">
                      <el-option v-for="u in unitOptions" :key="u.id" :label="u.name" :value="u.id" />
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
                      <span style="color:#165dff;font-weight:500">{{ fd.unit_name || '基础单位' }}</span>
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
              <div v-if="auxUnitRows.length === 0 && !isView" style="text-align:center;color:#86909c;font-size:13px;padding:12px 0">
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
                  <span :style="fd.multi_spec ? 'color:#165dff;font-weight:500' : ''">启用多规格</span>
                </el-checkbox>
              </div>
              <el-button v-if="fd.multi_spec && !isView" size="small" type="primary" @click="addSpecAttr">+ 添加规格属性</el-button>
            </div>

            <!-- 单规格模式 -->
            <div v-if="!fd.multi_spec" style="color:#86909c;font-size:13px;padding:12px 0">
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

              <div v-if="specAttrs.length === 0" style="color:#86909c;font-size:13px;padding:8px 0">
                点击右上角"添加规格属性"开始设置规格，如：颜色（红/蓝/绿）、尺寸（S/M/L/XL）
              </div>

              <!-- SKU 组合表格 -->
              <div v-if="skuList.length > 0" style="margin-top:16px">
                <div style="font-size:13px;font-weight:600;color:#1d2129;margin-bottom:8px">
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
                  <div v-if="bomCostDetail" style="font-size:11px;color:#86909c;margin-top:4px;line-height:1.6">
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

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Edit, Delete, ArrowRight } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import {
  getGoodsList, createGoods, updateGoods, deleteGoods,
  getGoodsCateList, createGoodsCate, updateGoodsCate, deleteGoodsCate,
  getBrandList, createBrand,
  getUnitList, createUnit,
  getSpecList, createSpec, deleteSpec,
  getBomByGoods,
} from '@/api/goods'

// ── 分类面板 ─────────────────────────────────────────────────────────────────
const cateOptions = ref<any[]>([])
const cateLoading = ref(false)
const cateKeyword = ref('')
const selectedCateId = ref<number | null>(null)
const collapsedCates = ref<Set<number>>(new Set())

function toggleCate(id: number) {
  if (collapsedCates.value.has(id)) collapsedCates.value.delete(id)
  else collapsedCates.value.add(id)
}

interface CateTreeNode { id: number; name: string; sort: number; parent_id: any; children: CateTreeNode[] }

const cateTree = computed<CateTreeNode[]>(() => {
  const all: CateTreeNode[] = cateOptions.value.map(c => ({ ...c, children: [] }))
  const keyword = cateKeyword.value
  // 搜索模式：扁平展示匹配项
  if (keyword) return all.filter(c => c.name.includes(keyword))
  // 树形模式
  const map: Record<number, CateTreeNode> = {}
  all.forEach(c => { map[c.id] = c })
  const roots: CateTreeNode[] = []
  all.forEach(c => {
    const pid = c.parent_id
    if (pid && map[pid]) map[pid].children.push(c)
    else roots.push(c)
  })
  return roots
})

const filteredCates = computed(() => {
  if (!cateKeyword.value) return cateOptions.value
  return cateOptions.value.filter(c => c.name.includes(cateKeyword.value))
})

// el-tree-select data (same as cateTree but el-tree-select needs the full tree structure)
const cateTreeSelectData = computed(() => cateTree.value)

async function loadCates() {
  cateLoading.value = true
  try {
    const res = await getGoodsCateList({ list_rows: 200 })
    const rows = res.data?.rows ?? []
    cateOptions.value = [...rows].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
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
  return goodsTypeMap.value[row.id] ?? row.goods_type ?? 1
}

// Cate IDs to show when a parent category is selected (parent + all children)
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
  if (!typeFilter && !cateFilter) return undefined
  return (row: any) => {
    if (typeFilter && !typeFilter(row)) return false
    if (cateFilter && !cateFilter(row)) return false
    return true
  }
})

// ── 品牌/单位选项 ─────────────────────────────────────────────────────────────
const brandOptions = ref<any[]>([])
const unitOptions = ref<any[]>([])

async function loadOptions() {
  const [b, u] = await Promise.all([
    getBrandList({ list_rows: 200 }),
    getUnitList({ list_rows: 200 }),
  ])
  brandOptions.value = b.data?.rows ?? []
  unitOptions.value = u.data?.rows ?? []
}

onMounted(() => { loadCates(); loadOptions() })

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

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该商品？', '提示', { type: 'warning' })
  await deleteGoods(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
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
  // Load multi-unit
  const saved = loadMultiUnits(fd.id)
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

function loadMultiUnits(goodsId: number): MultiUnitRow[] {
  try {
    const map = JSON.parse(localStorage.getItem(MULTI_UNIT_KEY) || '{}')
    const rows: MultiUnitRow[] = map[goodsId] ?? []
    // Backfill price fields for older stored rows that lack them
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

function onMultiUnitSelect(unitId: number, idx: number) {
  const u = unitOptions.value.find(u => u.id === unitId)
  if (u) multiUnitRows.value[idx].unit_name = u.name
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
]
const activeTab = ref('base')
const scrollRef = ref<HTMLDivElement>()
const secBase = ref<HTMLDivElement>()
const secUnit = ref<HTMLDivElement>()
const secSpec = ref<HTMLDivElement>()
const secPrice = ref<HTMLDivElement>()
const secRemark = ref<HTMLDivElement>()

function scrollToSection(key: string) {
  const map: Record<string, any> = { base: secBase, unit: secUnit, spec: secSpec, price: secPrice, remark: secRemark }
  map[key]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeTab.value = key
}

function onScroll() {
  const refs = [
    { key: 'remark', el: secRemark }, { key: 'price', el: secPrice },
    { key: 'spec', el: secSpec }, { key: 'unit', el: secUnit }, { key: 'base', el: secBase },
  ]
  const container = scrollRef.value
  if (!container) return
  const top = container.scrollTop + 80
  for (const { key, el } of refs) {
    if (el.value && el.value.offsetTop <= top) { activeTab.value = key; return }
  }
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
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 12px;
}

.cate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #f2f3f5;
  flex-shrink: 0;
}

.cate-title { font-size: 13px; font-weight: 600; color: #1d2129; }

.cate-search { padding: 8px 10px; flex-shrink: 0; }

.cate-tree { flex: 1; overflow-y: auto; }

.cate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  transition: background 0.12s;
}
.cate-item:hover { background: #f5f7ff; }
.cate-item:hover .cate-item-actions { opacity: 1; }
.cate-item.active { background: #e8f0fe; color: #165dff; font-weight: 500; }
.cate-item-child { padding-left: 20px; font-size: 12px; color: #86909c; }
.cate-item-child.active { color: #165dff; }
.cate-arrow { font-size: 12px; margin-right: 4px; color: #86909c; transition: transform 0.2s; flex-shrink: 0; cursor: pointer; }
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
  color: #86909c;
  cursor: pointer;
  padding: 2px;
}
.act-icon:hover { color: #165dff; }
.act-icon.danger:hover { color: #f53f3f; }

.cate-empty { text-align: center; color: #86909c; font-size: 12px; padding: 20px 0; }

/* 右侧商品列表 */
.goods-list-wrap { flex: 1; overflow: hidden; }

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
  color: #4e5969;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
}
.tab-item:hover { color: #165dff; }
.tab-item.active { color: #165dff; border-bottom-color: #165dff; font-weight: 500; }

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
  border-radius: 8px;
  padding: 20px 24px 8px;
  border: 1px solid #e4e7ed;
}

.sec-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f2f3f5;
}

.sec-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f2f3f5;
}

.sec-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.row-with-add { display: flex; gap: 8px; width: 100%; }

.field-hint { font-size: 11px; color: #86909c; margin-top: 4px; line-height: 1.4; }

/* ── 多规格编辑器 ── */
.spec-editor { padding: 4px 0; }

.spec-attr-row {
  background: #f8f9fd;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
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
  color: #4e5969;
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
</style>
