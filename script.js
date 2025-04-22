document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const noImagePlaceholder = document.getElementById('noImagePlaceholder');
    const watermarkToggle = document.getElementById('watermarkToggle');
    const watermarkControls = document.getElementById('watermarkControls');
    const watermarkSection = document.querySelector('.watermark-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    let currentImage = null;
    let watermarkText = '图片字幕生成器';
    
    // 初始状态隐藏画布
    canvas.style.display = 'none';
    
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

    // 设置导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // 滚动监听，高亮当前区域的导航项
    function highlightNavOnScroll() {
        const scrollPosition = window.scrollY + 100; // 添加一些偏移以提前激活
        
        // 找到当前区域并高亮导航
        let currentSectionId = sections[0].id; // 默认第一个区域
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.id;
            }
        });
        
        // 更新导航高亮
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    // 监听滚动事件
    window.addEventListener('scroll', highlightNavOnScroll);
    
    // 首次加载时调用一次以设置初始高亮
    highlightNavOnScroll();

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
                        noImagePlaceholder.style.display = 'none';
                    }
                    canvas.style.display = 'block';
                    generateSubtitledImage();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 监听所有控件的变化，实时更新预览
    const controls = [
        'lineHeight', 
        'fontSize', 
        'textColor', 
        'strokeColor', 
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

        // 获取所有配置
        const lineHeight = parseInt(document.getElementById('lineHeight').value);
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const textColor = document.getElementById('textColor').value;
        const strokeColor = document.getElementById('strokeColor').value;
        const subtitleText = document.getElementById('subtitleText').value;
        const lines = subtitleText.split('\n').filter(line => line.trim());

        // 设置画布尺寸
        canvas.width = currentImage.width;
        canvas.height = currentImage.height + (lineHeight * lines.length);

        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制图片
        ctx.drawImage(currentImage, 0, 0);

        // 设置文字样式
        ctx.textAlign = 'center';
        ctx.font = `${fontSize}px Arial`;
        ctx.lineWidth = 3;

        // 获取底部区域作为字幕背景
        const subtitleHeight = lineHeight * lines.length;
        const bottomArea = ctx.getImageData(0, currentImage.height - 20, canvas.width, 20);

        // 为每行字幕绘制背景和分割线
        lines.forEach((line, index) => {
            const y = currentImage.height + (index * lineHeight);
            
            // 重复底部区域作为字幕背景
            for (let i = 0; i < lineHeight; i++) {
                ctx.putImageData(bottomArea, 0, y + i);
            }

            // 添加分割线
            if (index > 0) {
                ctx.beginPath();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 1;
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 绘制文字轮廓
            ctx.lineWidth = 3;
            ctx.strokeStyle = strokeColor;
            ctx.strokeText(line, canvas.width / 2, y + (lineHeight / 2) + (fontSize / 3));

            // 绘制文字
            ctx.fillStyle = textColor;
            ctx.fillText(line, canvas.width / 2, y + (lineHeight / 2) + (fontSize / 3));
        });

        // 仅在水印开关打开时绘制水印
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
});