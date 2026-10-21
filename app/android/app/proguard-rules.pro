# Gemelo / Capacitor — garder plugins, WebView, Cordova
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,Exceptions,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile

-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keep class online.gemelo.app.** { *; }

-keepclassmembers class * {
    @com.getcapacitor.PluginMethod *;
}
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}

-keepclasseswithmembernames class * {
    native <methods>;
}

-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**
