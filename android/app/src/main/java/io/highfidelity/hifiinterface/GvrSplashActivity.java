package io.highfidelity.hifiinterface;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.opengl.GLUtils;
import android.opengl.Matrix;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;

import com.google.vr.sdk.base.AndroidCompat;
import com.google.vr.sdk.base.Eye;
import com.google.vr.sdk.base.GvrActivity;
import com.google.vr.sdk.base.GvrView;
import com.google.vr.sdk.base.HeadTransform;
import com.google.vr.sdk.base.Viewport;

import javax.microedition.khronos.egl.EGLConfig;

import io.highfidelity.hifiinterface.util.Util;

import static android.opengl.GLES20.*;

public class GvrSplashActivity extends GvrActivity implements GvrView.StereoRenderer {

    private static final String TAG = "GvrSplashActivity";

    private native void registerLoadCompleteListener();

    private static final String[] OBJECT_VERTEX_SHADER_CODE =
            new String[] {
                    "#version 310 es",
                    "precision mediump float;",
                    "out vec2 varTexCoord0;",
                    "",
                    "void main() {",
                    "vec4 UNIT_QUAD[4] = vec4[4](",
                    "vec4(-1.0, -1.0, 1.0, 1.0),",
                    "vec4(1.0, -1.0, 1.0, 1.0),",
                    "vec4(-1.0, 1.0, 1.0, 1.0),",
                    "vec4(1.0, 1.0, 1.0, 1.0));",
                    "  vec4 pos = UNIT_QUAD[gl_VertexID];",
                    "  varTexCoord0 = vec2((pos.x + 1.0) * 0.5, (-pos.y + 1.0) * 0.5);",
                    "  gl_Position = pos;",
                    "}",
            };
    private static final String[] OBJECT_FRAGMENT_SHADER_CODE =
            new String[] {
                    "#version 310 es",
                    "precision mediump float;",
                    "uniform sampler2D colorMap;",
                    "in vec2 varTexCoord0;",
                    "out vec4 outFragColor;",
                    "",
                    "void main() {",
                    "  // The y coordinate of this sample's textures is reversed compared to",
                    "  // what OpenGL expects, so we invert the y coordinate.",
                    "  outFragColor = texture(colorMap, varTexCoord0);",
                    "}",
            };
/*
private static final String[] OBJECT_VERTEX_SHADER_CODE =
        new String[] {
                "uniform mat4 u_MVP;",
                "attribute vec4 a_Position;",
                "attribute vec2 a_UV;",
                "varying vec2 v_UV;",
                "",
                "void main() {",
                "  v_UV = a_UV;",
                "  gl_Position = u_MVP * a_Position;",
                "}",
        };
    private static final String[] OBJECT_FRAGMENT_SHADER_CODE =
            new String[] {
                    "precision mediump float;",
                    "varying vec2 v_UV;",
                    "uniform sampler2D u_Texture;",
                    "",
                    "void main() {",
                    "  // The y coordinate of this sample's textures is reversed compared to",
                    "  // what OpenGL expects, so we invert the y coordinate.",
                    "  gl_FragColor = texture2D(u_Texture, vec2(v_UV.x, 1.0 - v_UV.y));",
                    "}",
            };*/

    private static final float Z_NEAR = 0.01f;
    private static final float Z_FAR = 10.0f;

    private int objectProgram;

    //private int objectModelViewProjectionParam;

    private float[] view;
    private float[] modelView;
    private float[] modelViewProjection;
    private float[] camera;

    private final int[] textureId = new int[1];

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initializeGvrView();

        view = new float[16];
        modelViewProjection = new float[16];
        modelView = new float[16];
        camera = new float[16];
        Log.d("[DAYDREAM]", "calling registerLoadCompleteListener");
        registerLoadCompleteListener();

        Handler handler = new Handler();

        handler.postDelayed(new Runnable() {
            public void run() {
                finish();
            }
        }, 10000);
    }

    public void initializeGvrView() {
        setContentView(R.layout.gvr_common_ui);

        GvrView gvrView = (GvrView) findViewById(R.id.gvr_view);
        gvrView.setEGLConfigChooser(8, 8, 8, 8, 16, 8);

        gvrView.setRenderer(this);
        gvrView.setTransitionViewEnabled(true);

        // Enable Cardboard-trigger feedback with Daydream headsets. This is a simple way of supporting
        // Daydream controller input for basic interactions using the existing Cardboard trigger API.
        gvrView.enableCardboardTriggerEmulation();

        if (gvrView.setAsyncReprojectionEnabled(true)) {
            // Async reprojection decouples the app framerate from the display framerate,
            // allowing immersive interaction even at the throttled clockrates set by
            // sustained performance mode.
            AndroidCompat.setSustainedPerformanceMode(this, true);
        }

        setGvrView(gvrView);
    }

    @Override
    public void onNewFrame(HeadTransform headTransform) {



        Util.checkGlError("onNewFrame");
    }

    @Override
    public void onDrawEye(Eye eye) {
        glEnable(GL_DEPTH_TEST);
        // The clear color doesn't matter here because it's completely obscured by
        // the room. However, the color buffer is still cleared because it may
        // improve performance.
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // Apply the eye transformation to the camera.
        Matrix.multiplyMM(view, 0, eye.getEyeView(), 0, camera, 0);

        // Build the ModelView and ModelViewProjection matrices
        // for calculating the position of the target object.
        float[] perspective = eye.getPerspective(Z_NEAR, Z_FAR);

        //Matrix.multiplyMM(modelView, 0, view, 0, modelTarget, 0);
        Matrix.multiplyMM(modelViewProjection, 0, perspective, 0, modelView, 0);
        drawLogo();


    }

    private void drawLogo() {
        glUseProgram(objectProgram);
        //GLES20.glUniformMatrix4fv(objectModelViewProjectionParam, 1, false, modelViewProjection, 0);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, textureId[0]);

        //GLES20.glDrawElements(GLES20.GL_TRIANGLES, indices.limit(), GLES20.GL_UNSIGNED_SHORT, indices);
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 6);

        Util.checkGlError("drawLogo");
    }

    @Override
    public void onFinishFrame(Viewport viewport) {

    }

    @Override
    public void onSurfaceChanged(int width, int height) {
        Log.i(TAG, "onSurfaceChanged");
    }


    /**
     * Creates the buffers we use to store information about the 3D world.
     *
     * <p>OpenGL doesn't use Java arrays, but rather needs data in a format it can understand.
     * Hence we use ByteBuffers.
     *
     * @param config The EGL configuration used when creating the surface.
     */
    @Override
    public void onSurfaceCreated(EGLConfig config) {
        Log.i(TAG, "onSurfaceCreated");
        glClearColor(1.0f, 0.0f, 0.0f, 0.0f);

        objectProgram = Util.compileProgram(OBJECT_VERTEX_SHADER_CODE, OBJECT_FRAGMENT_SHADER_CODE);

        //objectModelViewProjectionParam = GLES20.glGetUniformLocation(objectProgram, "u_MVP");

        Util.checkGlError("Object program params");

        //Matrix.setIdentityM(modelRoom, 0);
        //Matrix.translateM(modelRoom, 0, 0, FLOOR_HEIGHT, 0);

        glGenTextures(1, textureId, 0);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, textureId[0]);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glTexParameteri(
                GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_NEAREST);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        @SuppressLint("ResourceType")
        Bitmap textureBitmap = BitmapFactory.decodeStream(getResources().openRawResource(R.drawable.hifi_vr_icon_front));
        GLUtils.texImage2D(GL_TEXTURE_2D, 0, textureBitmap, 0);
        textureBitmap.recycle();
        glGenerateMipmap(GL_TEXTURE_2D);


        Util.checkGlError("onSurfaceCreated");
        /*
        try {
            room = new TexturedMesh(this, "CubeRoom.obj", objectPositionParam, objectUvParam);
            roomTex = new Texture(this, "CubeRoom_BakedDiffuse.png");
            targetObjectMeshes = new ArrayList<>();
            targetObjectNotSelectedTextures = new ArrayList<>();
            targetObjectSelectedTextures = new ArrayList<>();
            targetObjectMeshes.add(
                    new TexturedMesh(this, "Icosahedron.obj", objectPositionParam, objectUvParam));
            targetObjectNotSelectedTextures.add(new Texture(this, "Icosahedron_Blue_BakedDiffuse.png"));
            targetObjectSelectedTextures.add(new Texture(this, "Icosahedron_Pink_BakedDiffuse.png"));
            targetObjectMeshes.add(
                    new TexturedMesh(this, "QuadSphere.obj", objectPositionParam, objectUvParam));
            targetObjectNotSelectedTextures.add(new Texture(this, "QuadSphere_Blue_BakedDiffuse.png"));
            targetObjectSelectedTextures.add(new Texture(this, "QuadSphere_Pink_BakedDiffuse.png"));
            targetObjectMeshes.add(
                    new TexturedMesh(this, "TriSphere.obj", objectPositionParam, objectUvParam));
            targetObjectNotSelectedTextures.add(new Texture(this, "TriSphere_Blue_BakedDiffuse.png"));
            targetObjectSelectedTextures.add(new Texture(this, "TriSphere_Pink_BakedDiffuse.png"));
        } catch (IOException e) {
            Log.e(TAG, "Unable to initialize objects", e);
        }*/
        //curTargetObject = random.nextInt(TARGET_MESH_COUNT);
    }

    @Override
    public void onRendererShutdown() {
        Log.i(TAG, "onRendererShutdown");
    }

    public void onAppLoadedComplete() {
        Log.d("[DAYDREAM]", "GvrSplashActivity::onAppLoadedComplete");
        GvrSplashActivity.this.finish();
    }

}
