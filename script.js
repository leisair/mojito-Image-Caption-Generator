document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const noImagePlaceholder = document.getElementById('noImagePlaceholder');
    const watermarkToggle = document.getElementById('watermarkToggle');
    const watermarkControls = document.getElementById('watermarkControls');
    const watermarkSection = document.querySelector('.watermark-section');
    const backgroundModeSelect = document.getElementById('backgroundMode');
    const subtitlePositionSelect = document.getElementById('subtitlePosition');
    
    let currentImage = null;
    let currentBackgroundMode = 'repeat'; // 默认模式
    let currentSubtitlePosition = 'overlay'; // 默认位置
    let watermarkText = '图片字幕生成器';
    
    // 初始状态设置
    // 添加或删除隐藏类，而不是直接修改display属性
    canvas.classList.add('hidden'); 
    
    // 初始化UI和控件
    function initializeControls() {
        // 设置背景模式默认值
        if (backgroundModeSelect) {
            backgroundModeSelect.value = 'repeat'; // 默认为复制模式
            currentBackgroundMode = 'repeat';
            console.log('初始化背景模式为:', backgroundModeSelect.value);
        }
        
        // 设置字幕位置默认值
        if (subtitlePositionSelect) {
            subtitlePositionSelect.value = 'overlay'; // 默认在图片底部直接添加字幕
            currentSubtitlePosition = 'overlay';
            console.log('初始化字幕位置为:', subtitlePositionSelect.value);
        }
    }
    
    // 页面加载时初始化控件
    initializeControls();
    
    // 设置导航高亮功能
    setupNavHighlighting();

    // 直接为背景模式和字幕位置选择器添加专门的事件监听
    if (backgroundModeSelect) {
        // 移除可能已存在的事件监听
        backgroundModeSelect.removeEventListener('change', handleBackgroundModeChange);
        // 添加新的事件监听
        backgroundModeSelect.addEventListener('change', handleBackgroundModeChange);
    }
    
    if (subtitlePositionSelect) {
        // 移除可能已存在的事件监听
        subtitlePositionSelect.removeEventListener('change', handleSubtitlePositionChange);
        // 添加新的事件监听
        subtitlePositionSelect.addEventListener('change', handleSubtitlePositionChange);
    }

    // 背景模式变更处理函数
    function handleBackgroundModeChange(e) {
        currentBackgroundMode = e.target.value;
        console.log('背景模式已切换为:', currentBackgroundMode);
        
        if (currentImage) {
            // 立即重新渲染图片
            generateSubtitledImage();
        }
    }
    
    // 字幕位置变更处理函数
    function handleSubtitlePositionChange(e) {
        currentSubtitlePosition = e.target.value;
        console.log('字幕位置已切换为:', currentSubtitlePosition);
        
        if (currentImage) {
            // 立即重新渲染图片
            generateSubtitledImage();
        }
    }
    
    // 初始化水印状态
    function updateWatermarkState(enabled) {
        if (enabled) {
            watermarkControls.classList.remove('hidden');
            watermarkSection.classList.remove('disabled-section');
        } else {
            watermarkControls.classList.add('hidden');
            watermarkSection.classList.add('disabled-section');
        }
        // 如果有图片，则重新生成
        if (currentImage) {
            generateSubtitledImage();
        }
    }
    
    // 设置初始状态
    updateWatermarkState(watermarkToggle.checked);

    // 水印开关事件监听
    watermarkToggle.addEventListener('change', (e) => {
        updateWatermarkState(e.target.checked);
    });

    // 图片加载处理
    document.getElementById('imageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;
                    // 隐藏占位符，显示画布
                    if (noImagePlaceholder) {
                        noImagePlaceholder.classList.add('hidden'); // 使用类来隐藏
                    }
                    canvas.classList.remove('hidden'); // 使用类来显示
                    generateSubtitledImage();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 监听其他控件的变化，实时更新预览（排除backgroundMode，它有专门的监听）
    const controls = [
        'lineHeight', 
        'fontSize', 
        'textColor', 
        'strokeColor',
        'strokeWidth',
        'fontWeight',
        'watermarkColor',
        'subtitleText', 
        'watermarkText', 
        'watermarkOpacity', 
        'watermarkStyle', 
        'watermarkSize',
        'watermarkStrokeToggle',
        'watermarkStrokeColor',
        'watermarkStrokeWidth',
        'watermarkShadowToggle',
        'watermarkFontWeight'
    ];
    
    controls.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // 对不同类型的输入应用不同的事件监听
            if (element.type === 'range' || element.type === 'color') {
                // 对于滑块和颜色选择器，实时更新
                element.addEventListener('input', generateSubtitledImage);
            } else if (element.tagName.toLowerCase() === 'select') {
                // 对于选择器，使用change事件
                element.addEventListener('change', generateSubtitledImage);
            } else {
                // 对于文本输入，在输入和失去焦点时更新
                element.addEventListener('input', generateSubtitledImage);
                element.addEventListener('blur', generateSubtitledImage);
            }
        }
    });

    // 保存按钮点击事件
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (!currentImage) {
            alert('请先选择一张图片');
            return;
        }
        
        if (!canvas.toDataURL) return;
        const link = document.createElement('a');
        link.download = 'subtitled-image.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // 当窗口大小变化时，重新生成预览
    window.addEventListener('resize', debounce(generateSubtitledImage, 200));

    // 防抖函数，避免频繁更新
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // 生成字幕图片
    function generateSubtitledImage() {
        if (!currentImage) return;

        // 确保获取最新的设置值
        if (backgroundModeSelect) {
            currentBackgroundMode = backgroundModeSelect.value;
        }
        
        if (subtitlePositionSelect) {
            currentSubtitlePosition = subtitlePositionSelect.value;
        }

        // 获取所有配置
        const lineHeight = parseInt(document.getElementById('lineHeight').value);
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const textColor = document.getElementById('textColor').value;
        const strokeColor = document.getElementById('strokeColor').value;
        const strokeWidth = parseFloat(document.getElementById('strokeWidth').value) || 3;
        const fontWeight = document.getElementById('fontWeight').value || 'bold';
        const subtitleText = document.getElementById('subtitleText').value;
        // 使用当前存储的背景模式和字幕位置
        const backgroundMode = currentBackgroundMode;
        const subtitlePosition = currentSubtitlePosition;
        const lines = subtitleText.split('\n').filter(line => line.trim());

        // 如果没有文本，直接返回原图
        if (lines.length === 0) {
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(currentImage, 0, 0);
            return;
        }

        console.log('生成图片，背景模式:', backgroundMode, '字幕位置:', subtitlePosition);

        // 设置画布尺寸
        canvas.width = currentImage.width;
        
        // 根据字幕位置和行数设置画布高度
        if (subtitlePosition === 'below') {
            // "增加一行后添加"模式 - 原图完整 + 字幕区域高度
            canvas.height = currentImage.height + (lineHeight * lines.length);
        } else if (subtitlePosition === 'overlay') {
            // "直接在原图底部添加"模式 
            // 如果只有一行，不增加高度；如果有多行，需要为额外的行增加高度
            canvas.height = currentImage.height + Math.max(0, lines.length - 1) * lineHeight;
        } else {
            // 默认行为 - 保持原图完整
            canvas.height = currentImage.height + (lineHeight * lines.length);
        }

        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制原图
        ctx.drawImage(currentImage, 0, 0);

        // 设置文字样式
        ctx.textAlign = 'center';
        ctx.font = `${fontWeight} ${fontSize}px Arial`;
        ctx.lineWidth = strokeWidth;

        // ========== 字幕背景处理逻辑 ==========
        
        // 1. 确定第一行字幕的起始Y坐标
        let firstLineY;
        if (subtitlePosition === 'overlay') {
            // "直接在原图底部添加"模式 - 字幕位于原图底部
            firstLineY = currentImage.height - lineHeight;
        } else { // 'below'
            // "增加一行后添加"模式 - 字幕位于原图下方
            firstLineY = currentImage.height;
        }
        
        // 2. 从原图底部采样字幕背景区域
        // 采样区域高度等于字幕行高
        const sampleY = currentImage.height - lineHeight;
        const backgroundSample = ctx.getImageData(0, sampleY, canvas.width, lineHeight);
        
        // 3. 处理字幕背景 - 根据选择的模式和位置
        if (subtitlePosition === 'below') {
            // ===== "增加一行后添加"模式 =====
            // 第一行字幕就开始应用背景
            
            if (backgroundMode === 'repeat') {
                // 复制模式: 所有行都使用相同的背景（直接复制采样区域）
                for (let i = 0; i < lines.length; i++) {
                    const y = firstLineY + (i * lineHeight);
                    ctx.putImageData(backgroundSample, 0, y);
                }
            } else { // 'stretch'
                // 拉伸模式: 为每一行重复底部采样区域的单行像素
                for (let i = 0; i < lines.length; i++) {
                    const y = firstLineY + (i * lineHeight);
                    // 获取原图底部的单行像素
                    const stretchSample = ctx.getImageData(0, currentImage.height - 1, canvas.width, 1);
                    // 重复这一行像素填充整个字幕行高
                    for (let j = 0; j < lineHeight; j++) {
                        ctx.putImageData(stretchSample, 0, y + j);
                    }
                }
            }
            
        } else { // 'overlay'
            // ===== "直接在原图底部添加"模式 =====
            // 第一行不添加背景（直接显示在原图上）
            // 从第二行开始应用背景样式
            
            if (lines.length > 1) {
                // 只有多于一行时才处理背景
                
                if (backgroundMode === 'repeat') {
                    // 复制模式: 后续行使用与第一行相同的背景区域
                    // 先提取第一行区域作为背景样本
                    const firstLineBackground = ctx.getImageData(0, firstLineY, canvas.width, lineHeight);
                    
                    // 应用到第二行及后续行
                    for (let i = 1; i < lines.length; i++) {
                        const y = firstLineY + (i * lineHeight);
                        ctx.putImageData(firstLineBackground, 0, y);
                    }
                } else { // 'stretch'
                    // 拉伸模式: 为后续每行重复原图底部的单行像素
                    for (let i = 1; i < lines.length; i++) {
                        const y = firstLineY + (i * lineHeight);
                        // 获取原图底部的单行像素
                        const stretchSample = ctx.getImageData(0, currentImage.height - 1, canvas.width, 1);
                        // 重复这一行像素填充整个字幕行高
                        for (let j = 0; j < lineHeight; j++) {
                            ctx.putImageData(stretchSample, 0, y + j);
                        }
                    }
                }
            }
        }
        
        // 4. 添加分割线
        // 只在有多行字幕时添加分割线
        if (lines.length > 1) {
            for (let i = 1; i < lines.length; i++) {
                const y = firstLineY + (i * lineHeight);
                ctx.beginPath();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1;
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        
        // 5. 绘制字幕文本
        lines.forEach((line, index) => {
            // 文本垂直居中于字幕行
            const y = firstLineY + (index * lineHeight) + (lineHeight / 2) + (fontSize / 3);
            
            // 绘制文本描边
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeColor;
            ctx.strokeText(line, canvas.width / 2, y);
            
            // 绘制文本
            ctx.fillStyle = textColor;
            ctx.fillText(line, canvas.width / 2, y);
        });

        // 如果启用了水印，绘制水印
        if (watermarkToggle.checked) {
            drawWatermark();
        }
    }
    
    // 单独抽取水印绘制函数，方便控制
    function drawWatermark() {
        const watermarkText = document.getElementById('watermarkText').value || '图片字幕生成器';
        const watermarkOpacity = parseFloat(document.getElementById('watermarkOpacity').value) || 0.7;
        const watermarkStyle = document.getElementById('watermarkStyle').value;
        const watermarkSize = parseInt(document.getElementById('watermarkSize').value);
        const watermarkStrokeEnabled = document.getElementById('watermarkStrokeToggle').checked;
        const watermarkStrokeColor = document.getElementById('watermarkStrokeColor').value;
        const watermarkStrokeWidth = parseFloat(document.getElementById('watermarkStrokeWidth').value) || 2;
        const watermarkShadowEnabled = document.getElementById('watermarkShadowToggle').checked;
        const watermarkFontWeight = document.getElementById('watermarkFontWeight').value;
        
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;
        ctx.font = `${watermarkFontWeight} ${watermarkSize}px Arial`;
        ctx.fillStyle = document.getElementById('watermarkColor').value;
        
        // 添加发光效果
        if (watermarkShadowEnabled) {
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        const textWidth = ctx.measureText(watermarkText).width;
        const padding = 20;

        switch (watermarkStyle) {
            case 'full':
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-Math.PI / 6);
                const pattern = {
                    width: textWidth + 50,
                    height: watermarkSize + 10
                };
                for (let x = -canvas.width; x < canvas.width; x += pattern.width) {
                    for (let y = -canvas.height; y < canvas.height; y += pattern.height) {
                        drawWatermarkText(watermarkText, x, y, watermarkStrokeEnabled, watermarkStrokeColor, watermarkStrokeWidth);
                    }
                }
                break;

            case 'top-right':
                ctx.textAlign = 'right';
                drawWatermarkText(watermarkText, canvas.width - padding, watermarkSize + padding, watermarkStrokeEnabled, watermarkStrokeColor, watermarkStrokeWidth);
                break;

            case 'bottom-right':
                ctx.textAlign = 'right';
                drawWatermarkText(watermarkText, canvas.width - padding, canvas.height - padding, watermarkStrokeEnabled, watermarkStrokeColor, watermarkStrokeWidth);
                break;

            case 'center':
                ctx.textAlign = 'center';
                drawWatermarkText(watermarkText, canvas.width / 2, canvas.height / 2, watermarkStrokeEnabled, watermarkStrokeColor, watermarkStrokeWidth);
                break;
        }
        
        ctx.restore();
    }
    
    // 帮助函数：绘制带描边的水印文本
    function drawWatermarkText(text, x, y, strokeEnabled, strokeColor, strokeWidth) {
        if (strokeEnabled) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeText(text, x, y);
        }
        ctx.fillText(text, x, y);
    }

    // 导航栏高亮显示当前章节
    function setupNavHighlighting() {
        const sections = document.querySelectorAll('.section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // 设置导航链接点击事件
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // 防止默认跳转行为
                
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                // 移除所有导航链接的活动状态
                navLinks.forEach(l => {
                    l.classList.remove('active');
                });
                
                // 添加当前链接的活动状态
                link.classList.add('active');
                
                // 平滑滚动到目标元素
                if (targetElement) {
                    // 使用scrollIntoView而不是scrollTo，以确保兼容性
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // 滚动监听函数，高亮当前区域的导航项
        function highlightNavOnScroll() {
            // 使用 document.documentElement.scrollTop 或 window.pageYOffset 获取滚动位置
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            // 找到当前区域并高亮导航
            let currentSectionId = null;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100; // 添加偏移量以提前激活
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSectionId = section.id;
                }
            });
            
            // 更新导航高亮
            if (currentSectionId) {
                navLinks.forEach(link => {
                    // 移除所有链接的活动状态
                    link.classList.remove('active');
                    
                    // 为当前部分的链接添加活动状态
                    if (link.getAttribute('href') === `#${currentSectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        }
        
        // 监听滚动事件
        window.addEventListener('scroll', highlightNavOnScroll);
        
        // 页面加载时执行一次，以设置初始状态
        highlightNavOnScroll();
    }
});