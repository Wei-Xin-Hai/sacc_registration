/* ============================================================
   SACC 科技创新大赛 · 表单校验与提交反馈脚本
   功能：
     1. 必填项不能为空
     2. 手机号格式校验（11 位数字，1 开头）
     3. 学号格式校验（南邮规则：字母 B/b + 8 位数字，如 B220230101）
     4. 邮箱格式校验（基础正则）
     5. 提交成功后弹出"报名成功"弹窗
   ============================================================ */

// ---------- 等待 DOM 加载完成后再绑定事件 ----------
document.addEventListener('DOMContentLoaded', function () {

  // 获取表单元素
  const form = document.getElementById('signup-form');

  // ------------------------------------------------------------
  // 校验规则定义：每个字段对应一个校验函数
  // 返回 null 表示通过；返回字符串表示错误提示信息
  // ------------------------------------------------------------
  const validators = {

    // 姓名：必填，2~20 个字符
    name: function (value) {
      if (!value.trim()) return '姓名不能为空';
      if (value.trim().length < 2 || value.trim().length > 20) return '姓名长度需在 2~20 个字符之间';
      return null;
    },

    // 学号：必填 + 格式校验（字母 B + 8 位数字，不区分大小写）
    studentId: function (value) {
      if (!value.trim()) return '学号不能为空';
      // 学号规则：B + 8 位数字（可根据自己学校的实际规则修改此正则）
      if (!/^[Bb]\d{8}$/.test(value.trim())) return '学号格式不正确（如 B220230101）';
      return null;
    },

    // 手机号：必填 + 11 位数字校验（1 开头的合法手机号段）
    phone: function (value) {
      if (!value.trim()) return '手机号不能为空';
      if (!/^1\d{10}$/.test(value.trim())) return '请输入正确的 11 位手机号';
      return null;
    },

    // 邮箱：必填 + 基础格式校验
    email: function (value) {
      if (!value.trim()) return '邮箱不能为空';
      if (!/^[\w.-]+@[\w-]+(\.[\w-]+)+$/.test(value.trim())) return '邮箱格式不正确';
      return null;
    },

    // 学院/专业：必填
    college: function (value) {
      if (!value.trim()) return '学院/专业不能为空';
      return null;
    },

    // 参赛类别：必选（下拉框）
    category: function (value) {
      if (!value) return '请选择参赛类别';
      return null;
    }
  };

  // ------------------------------------------------------------
  // 工具函数：显示 / 清除某个字段的错误状态
  // fieldId: 输入框的 id
  // message: 错误信息（null 表示校验通过）
  // ------------------------------------------------------------
  function setFieldStatus(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.querySelector('[data-error-for="' + fieldId + '"]');

    if (message) {
      // 校验失败：红框 + 显示错误文字
      input.classList.add('invalid');
      input.classList.remove('valid');
      errorEl.textContent = message;
    } else {
      // 校验通过：绿框 + 清空错误文字
      input.classList.remove('invalid');
      input.classList.add('valid');
      errorEl.textContent = '';
    }
  }

  // ------------------------------------------------------------
  // 校验单个字段（供 blur 失焦事件和 submit 共用）
  // ------------------------------------------------------------
  function validateField(fieldId) {
    const input = document.getElementById(fieldId);
    const validateFn = validators[fieldId];
    if (!validateFn) return true; // 没有规则的字段（如宣言）直接通过

    const message = validateFn(input.value);
    setFieldStatus(fieldId, message);
    return message === null;
  }

  // ------------------------------------------------------------
  // 为每个需要校验的字段绑定「失焦即时校验」
  // 用户离开输入框时立刻提示，体验更好
  // ------------------------------------------------------------
  Object.keys(validators).forEach(function (fieldId) {
    const input = document.getElementById(fieldId);
    // blur：失焦时校验
    input.addEventListener('blur', function () {
      validateField(fieldId);
    });
    // input：输入时若之前有错误，实时重新校验，错误提示即时消失
    input.addEventListener('input', function () {
      if (input.classList.contains('invalid')) {
        validateField(fieldId);
      }
    });
  });

  // ------------------------------------------------------------
  // 下拉框 change 事件：选择后立即校验
  // ------------------------------------------------------------
  document.getElementById('category').addEventListener('change', function () {
    validateField('category');
  });

  // ------------------------------------------------------------
  // 表单提交：逐项校验，全部通过则弹出"报名成功"弹窗
  // ------------------------------------------------------------
  form.addEventListener('submit', function (e) {
    // 阻止表单默认提交行为（避免页面刷新丢失校验提示）
    e.preventDefault();

    let allValid = true;
    let firstInvalid = null; // 记录第一个校验失败的输入框，用于聚焦

    // 遍历所有规则，依次校验
    Object.keys(validators).forEach(function (fieldId) {
      const ok = validateField(fieldId);
      if (!ok) {
        allValid = false;
        if (!firstInvalid) firstInvalid = document.getElementById(fieldId);
      }
    });

    // 有未通过项：聚焦到第一个错误输入框，滚动到可见位置
    if (!allValid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // ---------- 全部校验通过：直接弹出"报名成功"弹窗 ----------
    // （已按要求省去数据收集与后端发送步骤）
    showSuccessModal();
  });

  // ------------------------------------------------------------
  // 弹窗：提交成功反馈
  // ------------------------------------------------------------
  function showSuccessModal() {
    // 动态创建遮罩层与弹窗 DOM
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML =
      '<div class="modal">' +
      '  <div class="modal-icon">✓</div>' +
      '  <h3>报名成功！</h3>' +
      '  <p>感谢你的参与，请保持手机畅通，等待后续通知。</p>' +
      '  <button id="modal-ok">好的</button>' +
      '</div>';

    document.body.appendChild(mask);

    // 点击"好的"按钮：关闭弹窗、重置表单
    document.getElementById('modal-ok').addEventListener('click', function () {
      mask.remove();     // 移除弹窗
      form.reset();      // 清空并重置所有表单字段
      // 重置后清除所有边框状态与错误提示
      document.querySelectorAll('.invalid, .valid').forEach(function (el) {
        el.classList.remove('invalid', 'valid');
      });
      document.querySelectorAll('.error-msg').forEach(function (el) {
        el.textContent = '';
      });
    });
  }
});
