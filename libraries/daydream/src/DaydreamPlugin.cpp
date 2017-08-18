#include <plugins/PluginManager.h>

#include <input-plugins/InputPlugin.h>

#include "daydream/DaydreamDisplayPlugin.h"
#include "daydream/DaydreamControllerManager.h"
#include "Android2DDisplayPlugin.h"
#include <QtAndroidExtras/QAndroidJniObject>

#if defined(ANDROID)
gvr_context* __gvr_context;
bool __vr_exit_requested;
QAndroidJniObject __activity;

DaydreamLibInstance::DaydreamLibInstance(){
    static std::once_flag once;
    std::call_once(once, [&] {
        qDebug() << __FILE__ << "has been initialized";
        
        // FIXME - this is a bit of a hack, and not quite how we expect things to be done.
        // Specifically because the application should really be responsible for loading the
        // built in plugins, and any dynamic plugins like the Daydream plugin. I needed to
        // hack in these two different versions of loadDisplayPlugins() because the Built In
        // plugins are exposed as a DisplayPluginList
        DisplayPlugin* DISPLAY_PLUGIN_POOL[] = {
            new Android2DDisplayPlugin(),
            new DaydreamDisplayPlugin(),
            nullptr
        };
        // Temporarily stop using DaydreamDisplayPlugin for the Top-Down view implementation ("God View")
        PluginManager::getInstance()->loadDisplayPlugins(DISPLAY_PLUGIN_POOL);
        //DisplayPluginList builtInDisplayPlugins = getDisplayPlugins();
        //PluginManager::getInstance()->loadDisplayPlugins(builtInDisplayPlugins);

        InputPlugin* INPUT_PLUGIN_POOL[] = {
            new DaydreamControllerManager(),
            nullptr
        };
        PluginManager::getInstance()->loadInputPlugins(INPUT_PLUGIN_POOL);

        InputPluginList builtInInputPlugins = getInputPlugins();
        PluginManager::getInstance()->loadInputPlugins(builtInInputPlugins);
    });
  }

extern "C" {

JNIEXPORT void Java_io_highfidelity_hifiinterface_InterfaceActivity_nativeOnCreate(JNIEnv* env, jobject obj, jobject instance, jobject asset_mgr, jlong gvr_context_ptr) {
    //qDebug() << "nativeOnCreate" << gvr_context_ptr << " On thread " << QThread::currentThreadId();
    __gvr_context = reinterpret_cast<gvr_context*>(gvr_context_ptr);
    __activity = QAndroidJniObject(instance);
}

JNIEXPORT void Java_io_highfidelity_hifiinterface_InterfaceActivity_nativeOnExitVr(JNIEnv* env, jobject obj) {
    __vr_exit_requested = true;
}


}

bool _exitVrRequested() {
    return __vr_exit_requested;
}

void _resetExitVrRequested() {
    __vr_exit_requested = false;
}

void notifyEnterVr() {
    __activity.callMethod<void>("enterVr", "()V");
}

void openUrlInAndroidWebView(QString urlString) {
    __activity.callMethod<void>("openUrlInAndroidWebView", "(Ljava/lang/String;)V", QAndroidJniObject::fromString(urlString).object<jstring>());
}

 GvrState* GvrState::instance = nullptr;

 GvrState::GvrState(gvr_context *ctx) :
    _gvr_context(ctx),
    _gvr_api(gvr::GvrApi::WrapNonOwned(_gvr_context)),
    _viewport_list(_gvr_api->CreateEmptyBufferViewportList()) {

}

void GvrState::init(gvr_context *ctx)
{
    if (ctx && !instance) {
        instance = new GvrState(ctx);
    }
}

GvrState * GvrState::getInstance()
{
    return instance;            
}

#endif