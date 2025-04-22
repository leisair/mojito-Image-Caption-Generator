document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const noImagePlaceholder = document.getElementById('noImagePlaceholder');
    const watermarkToggle = document.getElementById('watermarkToggle');
    const watermarkControls = document.getElementById('watermarkControls');
    const watermarkSection = document.querySelector('.watermark-section');
    
    let currentImage = null;
    let watermarkText = '图片字幕生成器';
    let watermarkEnabled = false; // 默认不启用水印

    // 初始状态隐藏画布和水印控制
    canvas.style.display = 'none';
    watermarkControls.classList.add('hidden');
    watermarkSection.classList.add('disabled-section');

    // 水印开关事件监听
    watermarkToggle.addEventListener('change', (e) => {
        watermarkEnabled = e.target.checked;
        if (watermarkEnabled) {
            watermarkControls.classList.remove('hidden');
            watermarkSection.classList.remove('disabled-section');
        } else {
            watermarkControls.classList.add('hidden');
            watermarkSection.classList.add('disabled-section');
        }
        generateSubtitledImage();
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
        'watermarkSize'
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

    // 生成按钮点击事件
    document.getElementById('generateBtn').addEventListener('click', generateSubtitledImage);

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
        if (watermarkEnabled && watermarkToggle.checked) {
            drawWatermark();
        }
    }
    
    // 单独抽取水印绘制函数，方便控制
    function drawWatermark() {
        const watermarkText = document.getElementById('watermarkText').value || '图片字幕生成器';
        const watermarkOpacity = parseFloat(document.getElementById('watermarkOpacity').value) || 0.3;
        const watermarkStyle = document.getElementById('watermarkStyle').value;
        const watermarkSize = parseInt(document.getElementById('watermarkSize').value);
        
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;
        ctx.font = `${watermarkSize}px Arial`;
        ctx.fillStyle = document.getElementById('watermarkColor').value;
        
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
                        ctx.fillText(watermarkText, x, y);
                    }
                }
                break;

            case 'top-right':
                ctx.textAlign = 'right';
                ctx.fillText(watermarkText, canvas.width - padding, watermarkSize + padding);
                break;

            case 'bottom-right':
                ctx.textAlign = 'right';
                ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
                break;

            case 'center':
                ctx.textAlign = 'center';
                ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
                break;
        }
        
        ctx.restore();
    }
});