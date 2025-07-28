// TabBar 配置 - 支持中英文切换
export const getTabBarConfig = (t) => {
  const config = {
    color: "#7A7E83",
    selectedColor: "#aac990",
    borderStyle: "white",
    backgroundColor: "#F5F5F5",
    height: "60px",
    list: [
      {
        pagePath: "pages/tabBar/component/component",
        iconPath: "static/home-unselect-1.png",
        selectedIconPath: "static/home-select-1.png",
        text: t('realtime_status')
      },
      {
        pagePath: "pages/tabBar/API/API",
        iconPath: "static/battery-unselect-1.png",
        selectedIconPath: "static/battary-select.png",
        text: t('display_control')
      },
      {
        pagePath: "pages/tabBar/extUI/extUI",
        iconPath: "static/settings-unselect-1.png",
        selectedIconPath: "static/settings-select-1.png",
        text: t('system_settings')
      }
    ]
  }
  
  console.log('TabBar 配置:', config.list.map(item => item.text))
  return config
} 